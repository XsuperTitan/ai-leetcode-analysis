package com.aicoding.analysis.mapper;

import com.aicoding.analysis.mapper.row.SystemDesignDiagramRow;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;
import org.apache.ibatis.annotations.Delete;

import java.sql.Timestamp;
import java.util.List;

@Mapper
public interface SystemDesignDiagramMapper {

    @Insert("""
            INSERT INTO system_design_diagram (
              diagram_id, app_id, title, description, nodes_json, edges_json, canvas_meta_json, created_at, updated_at
            ) VALUES (
              #{diagramId}, #{appId}, #{title}, #{description}, #{nodesJson}, #{edgesJson}, #{canvasMetaJson}, #{createdAt}, #{updatedAt}
            )
            """)
    int insert(
            @Param("diagramId") String diagramId,
            @Param("appId") String appId,
            @Param("title") String title,
            @Param("description") String description,
            @Param("nodesJson") String nodesJson,
            @Param("edgesJson") String edgesJson,
            @Param("canvasMetaJson") String canvasMetaJson,
            @Param("createdAt") Timestamp createdAt,
            @Param("updatedAt") Timestamp updatedAt
    );

    @Update("""
            UPDATE system_design_diagram
            SET app_id = #{appId},
                title = #{title},
                description = #{description},
                nodes_json = #{nodesJson},
                edges_json = #{edgesJson},
                canvas_meta_json = #{canvasMetaJson},
                updated_at = #{updatedAt}
            WHERE diagram_id = #{diagramId}
            """)
    int update(
            @Param("diagramId") String diagramId,
            @Param("appId") String appId,
            @Param("title") String title,
            @Param("description") String description,
            @Param("nodesJson") String nodesJson,
            @Param("edgesJson") String edgesJson,
            @Param("canvasMetaJson") String canvasMetaJson,
            @Param("updatedAt") Timestamp updatedAt
    );

    @Select("""
            SELECT diagram_id, app_id, title, description, nodes_json, edges_json, canvas_meta_json, created_at, updated_at
            FROM system_design_diagram
            WHERE diagram_id = #{diagramId}
            LIMIT 1
            """)
    SystemDesignDiagramRow getByDiagramId(@Param("diagramId") String diagramId);

    @Select("""
            SELECT diagram_id, app_id, title, description, nodes_json, edges_json, canvas_meta_json, created_at, updated_at
            FROM system_design_diagram
            WHERE (#{keyword} = '' OR LOWER(title) LIKE CONCAT('%', LOWER(#{keyword}), '%'))
            ORDER BY created_at DESC
            LIMIT #{limit} OFFSET #{offset}
            """)
    List<SystemDesignDiagramRow> list(
            @Param("keyword") String keyword,
            @Param("limit") int limit,
            @Param("offset") long offset
    );

    @Delete("DELETE FROM system_design_diagram WHERE diagram_id = #{diagramId}")
    int deleteByDiagramId(@Param("diagramId") String diagramId);
}
