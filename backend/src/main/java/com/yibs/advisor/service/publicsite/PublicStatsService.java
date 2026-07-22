package com.yibs.advisor.service.publicsite;

import com.yibs.advisor.dto.response.PublicStatsResponse;
import com.yibs.advisor.repository.ChatMessageRepository;
import com.yibs.advisor.repository.CourseRepository;
import com.yibs.advisor.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class PublicStatsService {

    private final StudentRepository studentRepository;
    private final CourseRepository courseRepository;
    private final ChatMessageRepository chatMessageRepository;

    public PublicStatsResponse getStats() {
        long activeStudents = studentRepository.count();
        long coursesOffered = courseRepository.count();
        long aiQueriesAnswered = chatMessageRepository.count();

        return PublicStatsResponse.builder()
                .activeStudents(activeStudents)
                .coursesOffered(coursesOffered)
                .aiQueriesAnswered(aiQueriesAnswered)
                .build();
    }
}
