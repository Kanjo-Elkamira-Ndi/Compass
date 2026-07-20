package com.yibs.advisor.service.course;

import com.yibs.advisor.domain.course.*;
import com.yibs.advisor.domain.user.Lecturer;
import com.yibs.advisor.domain.user.Student;
import com.yibs.advisor.dto.request.CreateCourseRequest;
import com.yibs.advisor.dto.response.CourseResponse;
import com.yibs.advisor.dto.response.EnrolmentResponse;
import com.yibs.advisor.exception.StudentNotFoundException;
import com.yibs.advisor.mapper.CourseMapper;
import com.yibs.advisor.mapper.EnrolmentMapper;
import com.yibs.advisor.repository.CourseRepository;
import com.yibs.advisor.repository.EnrolmentRepository;
import com.yibs.advisor.repository.LecturerRepository;
import com.yibs.advisor.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CourseServiceImpl implements ICourseService {

    private final CourseRepository courseRepository;
    private final EnrolmentRepository enrolmentRepository;
    private final StudentRepository studentRepository;
    private final LecturerRepository lecturerRepository;
    private final CourseMapper courseMapper;
    private final EnrolmentMapper enrolmentMapper;

    @Override
    @Transactional(readOnly = true)
    public Page<CourseResponse> listCourses(String search, Pageable pageable) {
        if (search != null && !search.isBlank()) {
            return courseRepository
                    .findByTitleContainingIgnoreCaseOrCodeContainingIgnoreCase(search, search, pageable)
                    .map(courseMapper::toResponse);
        }
        return courseRepository.findAll(pageable).map(courseMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public CourseResponse getCourseById(UUID id) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Course not found: " + id));
        CourseResponse response = courseMapper.toResponse(course);
        response.setEnrolledCount(enrolmentRepository.findByCourseId(id).size());
        return response;
    }

    @Override
    @Transactional
    public CourseResponse createCourse(CreateCourseRequest request) {
        Lecturer lecturer = null;
        if (request.getLecturerId() != null) {
            lecturer = lecturerRepository.findById(request.getLecturerId()).orElse(null);
        }

        Course course = Course.builder()
                .code(request.getCode())
                .title(request.getTitle())
                .creditHours(request.getCreditHours())
                .programme(request.getProgramme())
                .semester(request.getSemester())
                .academicYear(request.getAcademicYear())
                .lecturer(lecturer)
                .timetableSlot(request.getTimetableSlot())
                .status(CourseStatus.OPEN)
                .build();

        course = courseRepository.save(course);
        return courseMapper.toResponse(course);
    }

    @Override
    @Transactional
    public CourseResponse updateCourse(UUID id, CreateCourseRequest request) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Course not found: " + id));

        if (request.getTitle() != null) course.setTitle(request.getTitle());
        if (request.getCreditHours() != null) course.setCreditHours(request.getCreditHours());
        if (request.getProgramme() != null) course.setProgramme(request.getProgramme());
        if (request.getSemester() != null) course.setSemester(request.getSemester());
        if (request.getAcademicYear() != null) course.setAcademicYear(request.getAcademicYear());
        if (request.getTimetableSlot() != null) course.setTimetableSlot(request.getTimetableSlot());
        if (request.getLecturerId() != null) {
            Lecturer lecturer = lecturerRepository.findById(request.getLecturerId()).orElse(null);
            course.setLecturer(lecturer);
        }

        course = courseRepository.save(course);
        return courseMapper.toResponse(course);
    }

    @Override
    @Transactional
    public EnrolmentResponse enrolStudent(UUID courseId, UUID studentId) {
        if (enrolmentRepository.existsByStudentIdAndCourseId(studentId, courseId)) {
            throw new com.yibs.advisor.exception.AlreadyEnrolledException();
        }

        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new StudentNotFoundException(studentId.toString()));
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found: " + courseId));

        Enrolment enrolment = Enrolment.builder()
                .student(student)
                .course(course)
                .status(EnrolmentStatus.ENROLLED)
                .build();

        enrolment = enrolmentRepository.save(enrolment);
        return enrolmentMapper.toResponse(enrolment);
    }

    @Override
    @Transactional
    public EnrolmentResponse dropCourse(UUID courseId, UUID studentId) {
        Enrolment enrolment = enrolmentRepository.findByStudentIdAndCourseId(studentId, courseId)
                .orElseThrow(() -> new RuntimeException("Enrolment not found"));

        enrolment.setStatus(EnrolmentStatus.DROPPED);
        enrolment = enrolmentRepository.save(enrolment);
        return enrolmentMapper.toResponse(enrolment);
    }
}
