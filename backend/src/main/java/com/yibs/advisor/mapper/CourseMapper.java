package com.yibs.advisor.mapper;

import com.yibs.advisor.domain.course.Course;
import com.yibs.advisor.dto.response.CourseResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface CourseMapper {

    @Mapping(source = "id", target = "id")
    @Mapping(source = "lecturer.id", target = "lecturerId")
    @Mapping(source = "lecturer.firstName", target = "lecturerName", defaultValue = "")
    @Mapping(target = "enrolledCount", ignore = true)
    CourseResponse toResponse(Course course);
}
