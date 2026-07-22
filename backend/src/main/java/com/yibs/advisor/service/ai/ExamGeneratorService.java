package com.yibs.advisor.service.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.yibs.advisor.domain.ai.Exam;
import com.yibs.advisor.domain.ai.ExamDifficulty;
import com.yibs.advisor.domain.ai.ExamQuestion;
import com.yibs.advisor.domain.ai.ExamStatus;
import com.yibs.advisor.domain.ai.QuestionType;
import com.yibs.advisor.domain.course.Course;
import com.yibs.advisor.domain.user.Lecturer;
import com.yibs.advisor.dto.request.ExamRequest;
import com.yibs.advisor.dto.request.SaveExamRequest;
import com.yibs.advisor.dto.response.ExamQuestionResponse;
import com.yibs.advisor.dto.response.ExamResponse;
import com.yibs.advisor.repository.CourseRepository;
import com.yibs.advisor.repository.ExamRepository;
import com.yibs.advisor.repository.LecturerRepository;
import com.yibs.advisor.service.ai.provider.AIProviderStrategy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class ExamGeneratorService {

    private final AIProviderStrategy aiProvider;
    private final ExamRepository examRepository;
    private final CourseRepository courseRepository;
    private final LecturerRepository lecturerRepository;
    private final ObjectMapper objectMapper;

    @Transactional
    public List<ExamQuestionResponse> generate(ExamRequest request, UUID lecturerId) {
        String typesStr = request.getTypes() != null && !request.getTypes().isEmpty()
                ? String.join(", ", request.getTypes())
                : "MCQ, THEORY";

        String systemPrompt = """
                You are an expert exam question generator. Generate exam questions based on the
                given topic, difficulty, and question types. Return a JSON array of questions.
                Each question should have:
                {
                    "questionType": "MCQ" or "THEORY" or "PRACTICAL" or "CASE_STUDY",
                    "questionText": "the question",
                    "options": [{"label": "A", "text": "option text", "correct": false}],
                    "correctAnswer": "the correct answer",
                    "explanation": "why this is correct"
                }
                For MCQ questions, provide exactly 4 options with exactly one correct.
                For THEORY questions, provide the answer in correctAnswer and no options.
                Only return the JSON array, no other text.
                """;

        String userMessage = String.format("""
                Generate %d exam questions on the topic: %s
                Difficulty: %s
                Question types: %s
                """, request.getCount(), request.getTopic(), request.getDifficulty(), typesStr);

        String aiResponse = aiProvider.chat(systemPrompt, userMessage);

        List<ExamQuestionResponse> questions = new ArrayList<>();
        try {
            String jsonStr = aiResponse.trim();
            if (jsonStr.contains("```json")) {
                jsonStr = jsonStr.replaceAll("```json\\s*", "").replaceAll("```", "");
            }
            JsonNode json = objectMapper.readTree(jsonStr);

            if (json.isArray()) {
                int order = 1;
                for (JsonNode q : json) {
                    ExamQuestionResponse.ExamQuestionResponseBuilder builder = ExamQuestionResponse.builder()
                            .id(UUID.randomUUID().toString())
                            .questionType(q.get("questionType").asText())
                            .questionText(q.get("questionText").asText())
                            .correctAnswer(q.has("correctAnswer") ? q.get("correctAnswer").asText() : "")
                            .orderIndex(order++)
                            .explanation(q.has("explanation") ? q.get("explanation").asText() : "");

                    if (q.has("options") && q.get("options").isArray()) {
                        List<ExamQuestionResponse.OptionResponse> options = new ArrayList<>();
                        for (JsonNode opt : q.get("options")) {
                            options.add(ExamQuestionResponse.OptionResponse.builder()
                                    .label(opt.get("label").asText())
                                    .text(opt.get("text").asText())
                                    .correct(opt.get("correct").asBoolean())
                                    .build());
                        }
                        builder.options(options);
                    }

                    questions.add(builder.build());
                }
            }
        } catch (Exception e) {
            log.error("Failed to parse exam questions: {}", e.getMessage());
        }

        return questions;
    }

    @Transactional
    public ExamResponse saveExam(SaveExamRequest request, UUID lecturerId) {
        Course course = courseRepository.findById(request.getCourseId())
                .orElseThrow(() -> new RuntimeException("Course not found"));
        Lecturer lecturer = lecturerRepository.findById(lecturerId)
                .orElseThrow(() -> new RuntimeException("Lecturer not found"));

        Exam exam = Exam.builder()
                .course(course)
                .lecturer(lecturer)
                .title(request.getTitle())
                .difficulty(ExamDifficulty.INTERMEDIATE)
                .status(ExamStatus.DRAFT)
                .build();

        List<ExamQuestion> examQuestions = new ArrayList<>();
        if (request.getQuestions() != null) {
            int order = 1;
            for (SaveExamRequest.ExamQuestionRequest q : request.getQuestions()) {
                ExamQuestion question = ExamQuestion.builder()
                        .exam(exam)
                        .questionType(QuestionType.valueOf(q.getQuestionType()))
                        .questionText(q.getQuestionText())
                        .correctAnswer(q.getCorrectAnswer())
                        .orderIndex(order++)
                        .build();
                examQuestions.add(question);
            }
        }

        exam.setQuestions(examQuestions);
        exam = examRepository.save(exam);

        return toResponse(exam);
    }

    private ExamResponse toResponse(Exam exam) {
        List<ExamQuestionResponse> questions = exam.getQuestions() != null
                ? exam.getQuestions().stream()
                    .map(q -> ExamQuestionResponse.builder()
                            .id(q.getId().toString())
                            .questionType(q.getQuestionType().name())
                            .questionText(q.getQuestionText())
                            .correctAnswer(q.getCorrectAnswer())
                            .orderIndex(q.getOrderIndex())
                            .build())
                    .toList()
                : List.of();

        return ExamResponse.builder()
                .id(exam.getId())
                .courseId(exam.getCourse().getId())
                .lecturerId(exam.getLecturer().getId())
                .title(exam.getTitle())
                .topic(exam.getTopic())
                .difficulty(exam.getDifficulty().name())
                .status(exam.getStatus().name())
                .questions(questions)
                .createdAt(exam.getCreatedAt())
                .build();
    }
}
