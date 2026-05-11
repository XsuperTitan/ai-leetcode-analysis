CREATE TABLE IF NOT EXISTS leetcode_analysis (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    analysis_id VARCHAR(64) NOT NULL UNIQUE,
    app_id VARCHAR(128) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    constraints_json JSON NOT NULL,
    language VARCHAR(32) NOT NULL,
    difficulty VARCHAR(32) NOT NULL,
    thinking LONGTEXT NOT NULL,
    solution_code LONGTEXT NOT NULL,
    time_complexity VARCHAR(128) NULL,
    space_complexity VARCHAR(128) NULL,
    key_points_json JSON NOT NULL,
    alternative_solutions_json JSON NOT NULL,
    markdown_content LONGTEXT NULL,
    created_at DATETIME(3) NOT NULL,
    updated_at DATETIME(3) NOT NULL,
    INDEX idx_leetcode_app_title (app_id, title),
    INDEX idx_leetcode_created_at (created_at)
);

CREATE TABLE IF NOT EXISTS system_design_diagram (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    diagram_id VARCHAR(64) NOT NULL UNIQUE,
    app_id VARCHAR(128) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    nodes_json JSON NOT NULL,
    edges_json JSON NOT NULL,
    canvas_meta_json JSON NOT NULL,
    created_at DATETIME(3) NOT NULL,
    updated_at DATETIME(3) NOT NULL,
    INDEX idx_diagram_app_title (app_id, title),
    INDEX idx_diagram_created_at (created_at)
);

CREATE TABLE IF NOT EXISTS interview_question_item (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    question_id VARCHAR(64) NOT NULL UNIQUE,
    query_id VARCHAR(64) NOT NULL,
    app_id VARCHAR(128) NOT NULL,
    question_text TEXT NOT NULL,
    answer_hints_json JSON NOT NULL,
    tags_json JSON NOT NULL,
    category VARCHAR(32) NOT NULL,
    level VARCHAR(32) NOT NULL,
    created_at DATETIME(3) NOT NULL,
    INDEX idx_interview_app_query (app_id, query_id),
    INDEX idx_interview_app_created (app_id, created_at)
);

CREATE TABLE IF NOT EXISTS question_favorite (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    app_id VARCHAR(128) NOT NULL,
    question_id VARCHAR(64) NOT NULL,
    created_at DATETIME(3) NOT NULL,
    UNIQUE KEY uk_app_question (app_id, question_id),
    INDEX idx_favorite_app_created (app_id, created_at)
);
