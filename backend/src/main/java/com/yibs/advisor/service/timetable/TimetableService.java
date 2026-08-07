package com.yibs.advisor.service.timetable;

import com.yibs.advisor.domain.course.Course;
import com.yibs.advisor.domain.course.CourseStatus;
import com.yibs.advisor.domain.course.LecturerAvailability;
import com.yibs.advisor.domain.user.Lecturer;
import com.yibs.advisor.dto.request.AvailabilitySlotRequest;
import com.yibs.advisor.dto.request.UpdateAvailabilityRequest;
import com.yibs.advisor.dto.response.AvailabilitySlotResponse;
import com.yibs.advisor.dto.response.GenerateTimetableResponse;
import com.yibs.advisor.dto.response.LecturerAvailabilityResponse;
import com.yibs.advisor.dto.response.TimetableDayResponse;
import com.yibs.advisor.dto.response.TimetableSlotResponse;
import com.yibs.advisor.repository.CourseRepository;
import com.yibs.advisor.repository.LecturerAvailabilityRepository;
import com.yibs.advisor.repository.LecturerRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class TimetableService {

    private static final List<String> DAYS = List.of(
            "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY");

    private static final List<String> SLOTS = List.of(
            "08:00-09:00", "09:00-10:00", "10:00-11:00", "11:00-12:00",
            "12:00-13:00", "13:00-14:00", "14:00-15:00", "15:00-16:00",
            "16:00-17:00");

    private final LecturerAvailabilityRepository availabilityRepository;
    private final LecturerRepository lecturerRepository;
    private final CourseRepository courseRepository;

    @Transactional(readOnly = true)
    public List<AvailabilitySlotResponse> getAvailability(UUID lecturerId) {
        return availabilityRepository.findByLecturerId(lecturerId).stream()
                .map(a -> new AvailabilitySlotResponse(dayLabel(a.getDayOfWeek()), a.getSlot()))
                .toList();
    }

    @Transactional
    public List<AvailabilitySlotResponse> updateAvailability(UUID lecturerId, UpdateAvailabilityRequest request) {
        Lecturer lecturer = lecturerRepository.findById(lecturerId)
                .orElseThrow(() -> new RuntimeException("Lecturer not found"));

        availabilityRepository.deleteByLecturerId(lecturerId);

        List<AvailabilitySlotRequest> requested = request.getSlots() == null ? List.of() : request.getSlots();
        List<LecturerAvailability> entities = requested.stream()
                .filter(s -> s.getDay() != null && s.getSlot() != null && isValidDay(s.getDay()))
                .map(s -> LecturerAvailability.builder()
                        .lecturer(lecturer)
                        .dayOfWeek(normalizeDay(s.getDay()))
                        .slot(s.getSlot().trim())
                        .build())
                .toList();

        availabilityRepository.saveAll(entities);
        return entities.stream()
                .map(a -> new AvailabilitySlotResponse(dayLabel(a.getDayOfWeek()), a.getSlot()))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<LecturerAvailabilityResponse> getAvailabilityForAll() {
        Map<UUID, List<AvailabilitySlotResponse>> byLecturer = new HashMap<>();
        for (LecturerAvailability availability : availabilityRepository.findAll()) {
            byLecturer.computeIfAbsent(availability.getLecturer().getId(), k -> new ArrayList<>())
                    .add(new AvailabilitySlotResponse(dayLabel(availability.getDayOfWeek()), availability.getSlot()));
        }

        return lecturerRepository.findAll().stream()
                .map(lecturer -> LecturerAvailabilityResponse.builder()
                        .lecturerId(lecturer.getId())
                        .lecturerName(lecturer.getFirstName() + " " + lecturer.getLastName())
                        .slots(byLecturer.getOrDefault(lecturer.getId(), List.of()))
                        .build())
                .toList();
    }

    @Transactional
    public GenerateTimetableResponse generateTimetable() {
        List<Course> courses = courseRepository.findAll();
        for (Course course : courses) {
            course.setTimetableSlot(null);
        }

        Map<UUID, Set<String>> availabilityByLecturer = new HashMap<>();
        for (LecturerAvailability availability : availabilityRepository.findAll()) {
            availabilityByLecturer
                    .computeIfAbsent(availability.getLecturer().getId(), k -> new HashSet<>())
                    .add(slotKey(availability.getDayOfWeek(), availability.getSlot()));
        }

        Set<String> lecturerBusy = new HashSet<>();
        Set<String> cohortBusy = new HashSet<>();
        List<String> skipped = new ArrayList<>();
        int scheduled = 0;

        // Most constrained courses first: fewer available slots earlier in the queue.
        List<Course> schedulable = courses.stream()
                .filter(course -> course.getStatus() == CourseStatus.OPEN)
                .filter(course -> course.getLecturer() != null)
                .sorted(Comparator
                        .comparingInt((Course course) ->
                                availabilityByLecturer.getOrDefault(course.getLecturer().getId(), Set.of()).size())
                        .thenComparing(Course::getCode))
                .toList();

        for (Course course : schedulable) {
            Set<String> lecturerSlots = availabilityByLecturer.getOrDefault(course.getLecturer().getId(), Set.of());
            String chosen = null;
            outer:
            for (String day : DAYS) {
                for (String slot : SLOTS) {
                    String slotKey = slotKey(day, slot);
                    if (!lecturerSlots.contains(slotKey)) {
                        continue;
                    }
                    String busyKey = course.getLecturer().getId() + "|" + slotKey;
                    if (lecturerBusy.contains(busyKey)) {
                        continue;
                    }
                    String cohortKey = course.getProgramme() + "|" + course.getSemester() + "|" + slotKey;
                    if (cohortBusy.contains(cohortKey)) {
                        continue;
                    }
                    chosen = slotKey;
                    break outer;
                }
            }

            if (chosen == null) {
                skipped.add(course.getCode());
                continue;
            }

            course.setTimetableSlot(chosen);
            lecturerBusy.add(course.getLecturer().getId() + "|" + chosen);
            cohortBusy.add(course.getProgramme() + "|" + course.getSemester() + "|" + chosen);
            scheduled++;
        }

        for (Course course : courses) {
            if (course.getStatus() != CourseStatus.OPEN) {
                continue;
            }
            if (course.getLecturer() == null) {
                skipped.add(course.getCode());
            } else if (!availabilityByLecturer.containsKey(course.getLecturer().getId())) {
                skipped.add(course.getCode());
            }
        }

        courseRepository.saveAll(courses);

        return GenerateTimetableResponse.builder()
                .scheduled(scheduled)
                .skipped(skipped)
                .generatedAt(OffsetDateTime.now())
                .build();
    }

    @Transactional(readOnly = true)
    public List<TimetableDayResponse> getTimetable(UUID lecturerFilter) {
        List<Course> courses = lecturerFilter == null
                ? courseRepository.findAll()
                : courseRepository.findByLecturerId(lecturerFilter);

        Map<String, List<TimetableSlotResponse>> byDay = new LinkedHashMap<>();
        for (String day : DAYS) {
            byDay.put(dayLabel(day), new ArrayList<>());
        }

        for (Course course : courses) {
            if (course.getTimetableSlot() == null) {
                continue;
            }
            int separator = course.getTimetableSlot().indexOf('-');
            if (separator <= 0) {
                continue;
            }
            String day = course.getTimetableSlot().substring(0, separator);
            String time = course.getTimetableSlot().substring(separator + 1);
            if (!DAYS.contains(day)) {
                continue;
            }
            byDay.get(dayLabel(day)).add(TimetableSlotResponse.builder()
                    .time(time)
                    .courseCode(course.getCode())
                    .courseName(course.getTitle())
                    .lecturerName(course.getLecturer() != null
                            ? course.getLecturer().getFirstName() + " " + course.getLecturer().getLastName()
                            : "")
                    .programme(course.getProgramme())
                    .semester(course.getSemester())
                    .room("")
                    .type("lecture")
                    .build());
        }

        return DAYS.stream()
                .map(day -> TimetableDayResponse.builder()
                        .day(dayLabel(day))
                        .slots(byDay.get(dayLabel(day)).stream()
                                .sorted(Comparator.comparing(TimetableSlotResponse::getTime))
                                .toList())
                        .build())
                .toList();
    }

    private String slotKey(String day, String slot) {
        return day + "-" + slot;
    }

    private boolean isValidDay(String day) {
        return DAYS.contains(normalizeDay(day));
    }

    private String normalizeDay(String day) {
        return day.trim().toUpperCase();
    }

    private String dayLabel(String day) {
        return day.charAt(0) + day.substring(1).toLowerCase();
    }
}
