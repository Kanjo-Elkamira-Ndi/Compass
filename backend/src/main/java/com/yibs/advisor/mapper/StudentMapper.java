package com.yibs.advisor.mapper;

import com.yibs.advisor.domain.user.Student;
import com.yibs.advisor.dto.response.StudentResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface StudentMapper {

    @Mapping(source = "email", target = "email")
    @Mapping(source = "createdAt", target = "createdAt")
    StudentResponse toResponse(Student student);
}
