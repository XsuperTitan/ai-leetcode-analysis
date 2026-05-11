package com.aicoding.analysis.mapper;

import com.aicoding.analysis.mapper.row.InterviewQuestionFavoriteRow;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.sql.Timestamp;
import java.util.List;

@Mapper
public interface InterviewQuestionMapper {

    @Insert("""
            INSERT INTO interview_question_item (
              question_id, query_id, app_id, question_text, answer_hints_json, tags_json, category, level, created_at
            ) VALUES (
              #{questionId}, #{queryId}, #{appId}, #{questionText}, #{answerHintsJson}, #{tagsJson}, #{category}, #{level}, #{createdAt}
            )
            """)
    int insertQuestion(
            @Param("questionId") String questionId,
            @Param("queryId") String queryId,
            @Param("appId") String appId,
            @Param("questionText") String questionText,
            @Param("answerHintsJson") String answerHintsJson,
            @Param("tagsJson") String tagsJson,
            @Param("category") String category,
            @Param("level") String level,
            @Param("createdAt") Timestamp createdAt
    );

    @Select("SELECT COUNT(*) FROM interview_question_item WHERE question_id = #{questionId}")
    Integer countByQuestionId(@Param("questionId") String questionId);

    @Insert("""
            INSERT IGNORE INTO question_favorite (app_id, question_id, created_at)
            SELECT app_id, question_id, #{createdAt}
            FROM interview_question_item
            WHERE question_id = #{questionId}
            LIMIT 1
            """)
    int insertFavoriteByQuestionId(
            @Param("questionId") String questionId,
            @Param("createdAt") Timestamp createdAt
    );

    @Delete("DELETE FROM question_favorite WHERE question_id = #{questionId}")
    int removeFavorite(@Param("questionId") String questionId);

    @Select({
            "<script>",
            "SELECT question_id",
            "FROM question_favorite",
            "WHERE app_id = #{appId}",
            "<if test='questionIds != null and questionIds.size() > 0'>",
            "  AND question_id IN",
            "  <foreach collection='questionIds' item='id' open='(' separator=',' close=')'>",
            "    #{id}",
            "  </foreach>",
            "</if>",
            "</script>"
    })
    List<String> findFavoriteQuestionIds(
            @Param("appId") String appId,
            @Param("questionIds") List<String> questionIds
    );

    @Select("""
            SELECT i.question_id, i.query_id, i.app_id, i.question_text, i.answer_hints_json, i.tags_json, i.created_at
            FROM interview_question_item i
            INNER JOIN question_favorite f
              ON i.question_id = f.question_id AND i.app_id = f.app_id
            WHERE i.app_id = #{appId}
            ORDER BY f.created_at DESC
            """)
    List<InterviewQuestionFavoriteRow> listFavorites(@Param("appId") String appId);
}
