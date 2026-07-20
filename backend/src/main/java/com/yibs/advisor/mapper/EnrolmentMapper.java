package com.yibs.advisor.mapper;

import com.yibs.advisor.domain.course.Enrolment;
import com.yibs.advisor.dto.response.EnrolmentResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface EnrolmentMapper {

    @Mapping(source = "student.id", target = "studentId")
    @Mapping(source = "course.id", target = "courseId")
    @Mapping(source = "course.code", target = "courseCode")
    @Mapping(source = "course.title", target = "courseName")
    EnrolmentResponse toResponse(Enrolment enrolment);
}
