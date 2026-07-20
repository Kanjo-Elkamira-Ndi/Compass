package com.yibs.advisor.service.performance;

import com.yibs.advisor.dto.request.GradeSubmissionRequest;
import com.yibs.advisor.dto.response.GpaResponse;
import com.yibs.advisor.dto.response.GradeRecordResponse;
import com.yibs.advisor.dto.response.RankingResponse;

import java.util.List;
import java.util.UUID;

public interface IPerformanceService {
    GradeRecordResponse submitGrade(GradeSubmissionRequest request);
    GpaResponse getStudentSummary(UUID studentId);
    List<RankingResponse> getRanking(UUID courseId);
}
