package com.yibs.advisor.service.timetable;

import com.yibs.advisor.domain.course.Course;
import com.yibs.advisor.domain.course.CourseStatus;
import com.yibs.advisor.domain.course.LecturerAvailability;
import com.yibs.advisor.domain.user.Lecturer;
import com.yibs.advisor.domain.user.UserStatus;
import com.yibs.advisor.dto.request.AvailabilitySlotRequest;
import com.yibs.advisor.dto.request.UpdateAvailabilityRequest;
import com.yibs.advisor.dto.response.AvailabilitySlotResponse;
import com.yibs.advisor.dto.response.GenerateTimetableResponse;
import com.yibs.advisor.dto.response.LecturerAvailabilityResponse;
import com.yibs.advisor.dto.response.TimetableDayResponse;
import com.yibs.advisor.repository.CourseRepository;
import com.yibs.advisor.repository.LecturerAvailabilityRepository;
import com.yibs.advisor.repository.LecturerRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TimetableServiceTest {

    @Mock private LecturerAvailabilityRepository availabilityRepository;
    @Mock private LecturerRepository lecturerRepository;
    @Mock private CourseRepository courseRepository;

    private TimetableService service;

    private Lecturer lecturer1;
    private Lecturer lecturer2;
    private Lecturer lecturer3;
    private Course c1;
    private Course c2;
    private Course c3;

    @BeforeEach
    void setUp() {
        service = new TimetableService(availabilityRepository, lecturerRepository, courseRepository);

        lecturer1 = lecturer("Ada", "Okonkwo");
        lecturer2 = lecturer("Bruno", "Minkou");
        lecturer3 = lecturer("Carla", "Ndongo");

        c1 = course("CSE-501", "Advanced Algorithms", lecturer1, "BSc Computer Science", (short) 1);
        c2 = course("CSE-502", "Machine Learning", lecturer1, "BSc Computer Science", (short) 1);
        c3 = course("DS-501", "Data Visualization", lecturer2, "BSc Data Science", (short) 1);
    }

    private Lecturer lecturer(String firstName, String lastName) {
        return Lecturer.builder()
                .id(UUID.randomUUID())
                .firstName(firstName)
                .lastName(lastName)
                .email(firstName.toLowerCase() + "@compass.edu")
                .status(UserStatus.ACTIVE)
                .build();
    }

    private Course course(String code, String title, Lecturer lecturer, String programme, short semester) {
        return Course.builder()
                .id(UUID.randomUUID())
                .code(code)
                .title(title)
                .creditHours((short) 3)
                .programme(programme)
                .semester(semester)
                .academicYear("2025-2026")
                .lecturer(lecturer)
                .status(CourseStatus.OPEN)
                .build();
    }

    private LecturerAvailability availability(Lecturer lecturer, String day, String slot) {
        return LecturerAvailability.builder()
                .id(UUID.randomUUID())
                .lecturer(lecturer)
                .dayOfWeek(day)
                .slot(slot)
                .build();
    }

    @Test
    void generateTimetable_assignsSlotsRespectingLecturerAndCohortConflicts() {
        Course unassigned = course("ECE-501", "Circuits", null, "BSc ECE", (short) 1);
        Course noAvailability = course("MAT-501", "Discrete Math", lecturer3, "BSc Computer Science", (short) 1);
        Course conflict = course("MAT-502", "Linear Algebra", lecturer2, "BSc Computer Science", (short) 1);
        Course closed = course("CLO-501", "Retired", lecturer2, "BSc Computer Science", (short) 1);
        closed.setStatus(CourseStatus.CLOSED);

        when(courseRepository.findAll()).thenReturn(List.of(c1, c2, c3, unassigned, noAvailability, conflict, closed));
        when(availabilityRepository.findAll()).thenReturn(List.of(
                availability(lecturer1, "MONDAY", "08:00-09:00"),
                availability(lecturer1, "MONDAY", "09:00-10:00"),
                availability(lecturer2, "MONDAY", "08:00-09:00")));
        when(courseRepository.saveAll(any())).thenAnswer(inv -> inv.getArgument(0));

        GenerateTimetableResponse response = service.generateTimetable();

        assertEquals(3, response.getScheduled());
        assertTrue(response.getSkipped().contains("ECE-501"));
        assertTrue(response.getSkipped().contains("MAT-501"));
        assertTrue(response.getSkipped().contains("MAT-502"));
        assertFalse(response.getSkipped().contains("CLO-501"));

        assertEquals("MONDAY-08:00-09:00", c3.getTimetableSlot());
        assertEquals("MONDAY-08:00-09:00", c1.getTimetableSlot());
        assertEquals("MONDAY-09:00-10:00", c2.getTimetableSlot());
        assertNull(unassigned.getTimetableSlot());
        assertNull(noAvailability.getTimetableSlot());
        assertNull(conflict.getTimetableSlot());
        assertNull(closed.getTimetableSlot());
    }

    @Test
    void getTimetable_filtersByLecturer() {
        c1.setTimetableSlot("MONDAY-08:00-09:00");
        c2.setTimetableSlot("TUESDAY-10:00-11:00");
        c3.setTimetableSlot("MONDAY-08:00-09:00");
        when(courseRepository.findByLecturerId(lecturer1.getId())).thenReturn(List.of(c1, c2));

        List<TimetableDayResponse> result = service.getTimetable(lecturer1.getId());

        assertEquals(5, result.size());
        TimetableDayResponse monday = result.stream()
                .filter(d -> d.getDay().equals("Monday")).findFirst().orElseThrow();
        assertEquals(1, monday.getSlots().size());
        assertEquals("CSE-501", monday.getSlots().get(0).getCourseCode());
        assertEquals("08:00-09:00", monday.getSlots().get(0).getTime());
        assertEquals("Ada Okonkwo", monday.getSlots().get(0).getLecturerName());

        TimetableDayResponse tuesday = result.stream()
                .filter(d -> d.getDay().equals("Tuesday")).findFirst().orElseThrow();
        assertEquals("CSE-502", tuesday.getSlots().get(0).getCourseCode());
    }

    @Test
    void getTimetable_withoutFilter_returnsAllScheduledCourses() {
        c1.setTimetableSlot("MONDAY-08:00-09:00");
        c2.setTimetableSlot("MONDAY-09:00-10:00");
        c3.setTimetableSlot("WEDNESDAY-08:00-09:00");
        when(courseRepository.findAll()).thenReturn(List.of(c1, c2, c3));

        List<TimetableDayResponse> result = service.getTimetable(null);

        TimetableDayResponse monday = result.stream()
                .filter(d -> d.getDay().equals("Monday")).findFirst().orElseThrow();
        assertEquals(2, monday.getSlots().size());
        assertEquals("CSE-501", monday.getSlots().get(0).getCourseCode());
        assertEquals("CSE-502", monday.getSlots().get(1).getCourseCode());
    }

    @Test
    void updateAvailability_replacesExistingAndNormalizesDays() {
        when(lecturerRepository.findById(lecturer1.getId())).thenReturn(Optional.of(lecturer1));

        AvailabilitySlotRequest slot = new AvailabilitySlotRequest();
        slot.setDay("monday");
        slot.setSlot("08:00-09:00");
        UpdateAvailabilityRequest request = new UpdateAvailabilityRequest();
        request.setSlots(List.of(slot));

        List<AvailabilitySlotResponse> result = service.updateAvailability(lecturer1.getId(), request);

        verify(availabilityRepository).deleteByLecturerId(lecturer1.getId());
        verify(availabilityRepository).saveAll(any());
        assertEquals(1, result.size());
        assertEquals("Monday", result.get(0).getDay());
        assertEquals("08:00-09:00", result.get(0).getSlot());
    }

    @Test
    void getAvailability_returnsLecturerSlots() {
        when(availabilityRepository.findByLecturerId(lecturer1.getId())).thenReturn(List.of(
                availability(lecturer1, "MONDAY", "08:00-09:00"),
                availability(lecturer1, "WEDNESDAY", "14:00-15:00")));

        List<AvailabilitySlotResponse> result = service.getAvailability(lecturer1.getId());

        assertEquals(2, result.size());
        assertEquals("Monday", result.get(0).getDay());
        assertEquals("Wednesday", result.get(1).getDay());
    }

    @Test
    void getAvailabilityForAll_groupsByLecturer() {
        when(availabilityRepository.findAll()).thenReturn(List.of(
                availability(lecturer1, "MONDAY", "08:00-09:00"),
                availability(lecturer2, "TUESDAY", "10:00-11:00")));
        when(lecturerRepository.findAll()).thenReturn(List.of(lecturer1, lecturer2));

        List<LecturerAvailabilityResponse> result = service.getAvailabilityForAll();

        assertEquals(2, result.size());
        assertEquals("Ada Okonkwo", result.get(0).getLecturerName());
        assertEquals(1, result.get(0).getSlots().size());
    }
}
