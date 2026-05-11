package com.aicoding.analysis.mapper;

import com.aicoding.analysis.mapper.row.LeetcodeAnalysisRow;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Delete;

import java.sql.Timestamp;
import java.util.List;

@Mapper
public interface LeetcodeAnalysisMapper {

    @Insert("""
            INSERT INTO leetcode_analysis (
              analysis_id, app_id, title, description, constraints_json, language, difficulty,
              thinking, solution_code, time_complexity, space_complexity, key_points_json,
              alternative_solutions_json, markdown_content, created_at, updated_at
            ) VALUES (
              #{analysisId}, #{appId}, #{title}, #{description}, #{constraintsJson}, #{language}, #{difficulty},
              #{thinking}, #{solutionCode}, #{timeComplexity}, #{spaceComplexity}, #{keyPointsJson},
              #{alternativeSolutionsJson}, #{markdownContent}, #{createdAt}, #{updatedAt}
            )
            """)
    int insert(
            @Param("analysisId") String analysisId,
            @Param("appId") String appId,
            @Param("title") String title,
            @Param("description") String description,
            @Param("constraintsJson") String constraintsJson,
            @Param("language") String language,
            @Param("difficulty") String difficulty,
            @Param("thinking") String thinking,
            @Param("solutionCode") String solutionCode,
            @Param("timeComplexity") String timeComplexity,
            @Param("spaceComplexity") String spaceComplexity,
            @Param("keyPointsJson") String keyPointsJson,
            @Param("alternativeSolutionsJson") String alternativeSolutionsJson,
            @Param("markdownContent") String markdownContent,
            @Param("createdAt") Timestamp createdAt,
            @Param("updatedAt") Timestamp updatedAt
    );

    @Select("""
            SELECT analysis_id, app_id, title, description, constraints_json, language, difficulty,
                   thinking, solution_code, time_complexity, space_complexity, key_points_json,
                   alternative_solutions_json, markdown_content, created_at
            FROM leetcode_analysis
            WHERE (#{keyword} = '' OR LOWER(title) LIKE CONCAT('%', LOWER(#{keyword}), '%'))
            ORDER BY created_at DESC
            LIMIT #{limit} OFFSET #{offset}
            """)
    List<LeetcodeAnalysisRow> list(
            @Param("keyword") String keyword,
            @Param("limit") int limit,
            @Param("offset") long offset
    );

    @Select("""
            SELECT analysis_id, app_id, title, description, constraints_json, language, difficulty,
                   thinking, solution_code, time_complexity, space_complexity, key_points_json,
                   alternative_solutions_json, markdown_content, created_at
            FROM leetcode_analysis
            WHERE analysis_id = #{analysisId}
            LIMIT 1
            """)
    LeetcodeAnalysisRow getByAnalysisId(@Param("analysisId") String analysisId);

    @Delete("DELETE FROM leetcode_analysis WHERE analysis_id = #{analysisId}")
    int deleteByAnalysisId(@Param("analysisId") String analysisId);
}
