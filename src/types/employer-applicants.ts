// FILE: src/types/employer-applicants.ts
// Shapes for the employer applicant pipeline (Ranked + Kanban tabs). Mirrors the
// 7A/Step-6 backend responses: getApplicantDetail / listApplicants / listStages /
// listArchiveReasons. Kept minimal — only the fields the pipeline UI consumes.

export type ScoreTier = 'strong' | 'good' | 'partial' | 'weak' | 'poor';

export interface ApplicantScore {
  id: string;
  score: number;
  tier: ScoreTier;
  matchedSkills: string[];
  missingSkills: string[];
  /** Detail-view fields (7C); optional so the leaner pipeline payloads still type-check. */
  bonusSkills?: string[];
  experienceFit?: string | null;
  locationFit?: string | null;
  noticePeriodFit?: string | null;
  explanation: string | null;
  processedAt: string | null;
  processingError: string | null;
}

/** One resume file's metadata (7A). Null when the candidate never uploaded one. */
export interface ResumeMeta {
  id: string;
  originalFilename: string | null;
  mimeType: string | null;
  sizeBytes: number | null;
  uploadedAt: string | null;
}

/** One stage-history entry. Archive/unarchive rows carry a note beginning "Archived:"/"Unarchived". */
export interface StageChange {
  id: string;
  fromStageId: string | null;
  toStageId: string | null;
  movedByUserId: string | null;
  note: string | null;
  movedAt: string | null;
}

/**
 * One employer-written note on an application (C3). Append-only: there is no edit or
 * delete endpoint, and updatedAt always equals createdAt today. The author fields are
 * a snapshot taken at write time (R2) — they are NOT a live join onto the employer
 * user, so a later rename leaves historical notes reading as they did when written.
 */
export interface ApplicantNote {
  id: string;
  applicationId: string;
  authorEmployerUserId: string | null;
  authorName: string | null;
  authorEmail: string;
  body: string;
  createdAt: string;
  updatedAt: string;
}

/** Full applicant detail payload (7A endpoint) consumed by the ApplicantDetail page. */
export interface ApplicantDetail extends Applicant {
  scoreJobStatus: ScoreJobStatus | null;
  stageChanges: StageChange[];
  resumeMeta: ResumeMeta | null;
  resumeDownloadUrl: string | null;
  resumeDownloadExpiresAt: string | null;
}

/**
 * Queue lifecycle of the AI scoring job — a separate axis from score.processingError.
 * 'queued' | 'processing' mean a rescore is in flight; the old score stays visible.
 */
export interface ScoreJobStatus {
  jobId: string;
  status: 'queued' | 'processing' | 'done' | 'failed';
  attemptCount: number;
  errorCode: string | null;
  nextTryAt: string | null;
  completedAt: string | null;
}

/** Response of POST /api/employer/applicants/:id/rescore. */
export interface RescoreResult {
  rescored: boolean;
  jobStatus: ScoreJobStatus['status'];
  jobId: string;
  attemptCount: number;
}

/** Refreshed signed resume URL (7A resume-url endpoint). */
export interface ResumeUrl {
  url: string;
  expiresAt: string;
}

export interface Applicant {
  application: {
    id: string;
    jobId: string;
    contactId: string;
    stageId: string;
    archived: { at: string; reasonId: string; note?: string } | null;
    appliedAt: string;
    /** Candidate-written note submitted at apply time (7A). Null when they left it blank. */
    coverNote: string | null;
    lastStageMovedAt: string;
  };
  contact: {
    id: string;
    email: string;
    fullName: string;
    phone: string | null;
    /** Parsed-profile enrichment (7A). Optional: the apply flow only fills email/phone
     *  today, so these are usually null/absent until the backend wires the resume parser
     *  in. github/portfolio aren't extracted yet — declared here so the UI lights up
     *  automatically once they are. */
    linkedinUrl?: string | null;
    githubUrl?: string | null;
    portfolioUrl?: string | null;
    location?: string | null;
  } | null;
  score: ApplicantScore | null;
}

export interface Stage {
  id: string;
  text: string;
  order: number;
  isTerminal: boolean;
  isDefault: boolean;
  terminalType: 'hired' | null;
}

export interface ArchiveReason {
  id: string;
  text: string;
  type: 'hired' | 'non-hired';
  status: string;
}

export type ApplicantSort = 'score' | 'date';

/** Per-item outcome of the PP1 bulk-archive endpoint (partial success is first-class). */
export interface BulkArchiveResult {
  succeeded: Array<{ id: string }>;
  failed: Array<{ id: string; code: string; message: string }>;
  total: number;
  successCount: number;
  failureCount: number;
}
