package com.yibs.advisor.service.course;

import com.yibs.advisor.domain.course.Course;
import com.yibs.advisor.domain.course.CourseStatus;
import com.yibs.advisor.domain.course.Enrolment;
import com.yibs.advisor.domain.course.EnrolmentStatus;
import com.yibs.advisor.domain.user.Lecturer;
import com.yibs.advisor.domain.user.Student;
import com.yibs.advisor.domain.user.UserStatus;
import com.yibs.advisor.dto.response.CourseResponse;
import com.yibs.advisor.dto.response.StudentResponse;
import com.yibs.advisor.mapper.CourseMapper;
import com.yibs.advisor.mapper.EnrolmentMapper;
import com.yibs.advisor.mapper.StudentMapper;
import com.yibs.advisor.repository.CourseRepository;
import com.yibs.advisor.repository.EnrolmentRepository;
import com.yibs.advisor.repository.LecturerRepository;
import com.yibs.advisor.repository.StudentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CourseServiceTest {

    @Mock private CourseRepository courseRepository;
    @Mock private EnrolmentRepository enrolmentRepository;
    @Mock private StudentRepository studentRepository;
    @Mock private LecturerRepository lecturerRepository;
    @Mock private CourseMapper courseMapper;
    @Mock private EnrolmentMapper enrolmentMapper;
    @Mock private StudentMapper studentMapper;

    private CourseServiceImpl service;

    private Lecturer lecturer;
    private Course c1;
    private Course c2;

    @BeforeEach
    void setUp() {
        service = new CourseServiceImpl(
                courseRepository, enrolmentRepository, studentRepository,
                lecturerRepository, courseMapper, enrolmentMapper, studentMapper);

        lecturer = Lecturer.builder()
                .id(UUID.randomUUID())
                .firstName("Ada")
                .lastName("Okonkwo")
                .email("ada@compass.edu")
                .status(UserStatus.ACTIVE)
                .build();

        c1 = Course.builder()
                .id(UUID.randomUUID())
                .code("CSE-501")
                .title("Advanced Algorithms")
                .creditHours((short) 3)
                .programme("BSc Computer Science")
                .semester((short) 1)
                .academicYear("2025-2026")
                .lecturer(lecturer)
                .status(CourseStatus.OPEN)
                .build();

        c2 = Course.builder()
                .id(UUID.randomUUID())
                .code("CSE-502")
                .title("Machine Learning")
                .creditHours((short) 3)
                .programme("BSc Computer Science")
                .semester((short) 1)
                .academicYear("2025-2026")
                .lecturer(lecturer)
                .status(CourseStatus.OPEN)
                .build();
    }

    private Student student(String firstName, String lastName, String programme) {
        return Student.builder()
                .id(UUID.randomUUID())
                .studentId("YIB" + UUID.randomUUID().toString().substring(0, 6))
                .firstName(firstName)
                .lastName(lastName)
                .programme(programme)
                .yearOfStudy((short) 2)
                .build();
    }

    private Enrolment enrolment(Student student, Course course, EnrolmentStatus status) {
        return Enrolment.builder()
                .id(UUID.randomUUID())
                .student(student)
                .course(course)
                .status(status)
                .build();
    }

    @Test
    void listLecturerCourses_returnsCoursesWithEnrolledCounts() {
        Student s1 = student("Aminata", "Diallo", "BSc Computer Science");
        Student s2 = student("Bruno", "Minkou", "BSc Data Science");
        Student s3 = student("Carla", "Ndongo", "BSc Computer Science");

        when(courseRepository.findByLecturerId(lecturer.getId())).thenReturn(List.of(c1, c2));
        when(enrolmentRepository.findByCourseId(c1.getId())).thenReturn(List.of(
                enrolment(s1, c1, EnrolmentStatus.ENROLLED),
                enrolment(s2, c1, EnrolmentStatus.ENROLLED),
                enrolment(s3, c1, EnrolmentStatus.ENROLLED)));
        when(enrolmentRepository.findByCourseId(c2.getId())).thenReturn(List.of(
                enrolment(s1, c2, EnrolmentStatus.ENROLLED)));
        when(courseMapper.toResponse(any(Course.class))).thenAnswer(inv -> {
            Course course = inv.getArgument(0);
            return CourseResponse.builder()
                    .id(course.getId())
                    .code(course.getCode())
                    .title(course.getTitle())
                    .lecturerId(lecturer.getId())
                    .build();
        });

        List<CourseResponse> result = service.listLecturerCourses(lecturer.getId());

        assertEquals(2, result.size());
        assertEquals(3, result.get(0).getEnrolledCount());
        assertEquals(1, result.get(1).getEnrolledCount());
    }

    @Test
    void listEnrolledStudents_returnsOnlyEnrolledSortedByLastName() {
        Student d = student("Diop", "Zou", "BSc Data Science");
        Student a = student("Anna", "Bello", "BSc Computer Science");
        Student m = student("Marc", "Abega", "BSc Data Science");

        when(enrolmentRepository.findByCourseId(c1.getId())).thenReturn(List.of(
                enrolment(d, c1, EnrolmentStatus.ENROLLED),
                enrolment(a, c1, EnrolmentStatus.DROPPED),
                enrolment(m, c1, EnrolmentStatus.ENROLLED),
                enrolment(a, c1, EnrolmentStatus.COMPLETED)));
        when(studentMapper.toResponse(any(Student.class))).thenAnswer(inv -> {
            Student student = inv.getArgument(0);
            return StudentResponse.builder()
                    .id(student.getId())
                    .studentId(student.getStudentId())
                    .firstName(student.getFirstName())
                    .lastName(student.getLastName())
                    .programme(student.getProgramme())
                    .build();
        });

        List<StudentResponse> result = service.listEnrolledStudents(c1.getId());

        assertEquals(2, result.size());
        assertEquals("Abega", result.get(0).getLastName());
        assertEquals("Zou", result.get(1).getLastName());
        assertEquals("BSc Data Science", result.get(0).getProgramme());
    }

    @Test
    void listEnrolledStudents_returnsEmptyWhenNoEnrolments() {
        when(enrolmentRepository.findByCourseId(c1.getId())).thenReturn(List.of());

        List<StudentResponse> result = service.listEnrolledStudents(c1.getId());

        assertTrue(result.isEmpty());
    }
}
