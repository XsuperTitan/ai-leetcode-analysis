package com.aicoding.analysis.controller;

import com.aicoding.analysis.config.InterviewRecordingProperties;
import com.aicoding.analysis.model.ApiResponse;
import com.aicoding.analysis.model.interview.InterviewRecordingReportResponse;
import com.aicoding.analysis.service.InterviewRecordingReportService;
import com.aicoding.analysis.service.TranscriptionService;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.Locale;

@RestController
@RequestMapping("/api/v1/interview-recording")
public class InterviewRecordingController {

    private final TranscriptionService transcriptionService;
    private final InterviewRecordingReportService interviewRecordingReportService;
    private final InterviewRecordingProperties interviewRecordingProperties;

    public InterviewRecordingController(
            TranscriptionService transcriptionService,
            InterviewRecordingReportService interviewRecordingReportService,
            InterviewRecordingProperties interviewRecordingProperties
    ) {
        this.transcriptionService = transcriptionService;
        this.interviewRecordingReportService = interviewRecordingReportService;
        this.interviewRecordingProperties = interviewRecordingProperties;
    }

    @PostMapping(value = "/report", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<InterviewRecordingReportResponse> report(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "appId", required = false) @SuppressWarnings("unused") String appId
    ) {
        validateMp3(file, interviewRecordingProperties.resolvedMaxUploadSizeBytes());
        String rawTranscript = transcriptionService.transcribeWithDefaultProvider(file);
        return ApiResponse.ok(interviewRecordingReportService.buildReport(rawTranscript));
    }

    private static void validateMp3(MultipartFile file, long maxBytes) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("file is required");
        }
        if (file.getSize() > maxBytes) {
            throw new IllegalArgumentException(
                    "File exceeds maximum size (" + maxBytes + " bytes). Use a shorter MP3 or raise INTERVIEW_RECORDING_MAX_UPLOAD_BYTES."
            );
        }
        String name = file.getOriginalFilename();
        if (name == null || !name.toLowerCase(Locale.ROOT).endsWith(".mp3")) {
            throw new IllegalArgumentException("Only .mp3 files are supported");
        }
    }
}
