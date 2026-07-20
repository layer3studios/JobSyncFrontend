// FILE: src/types/employer-jobs.ts
// Native posting types — mirror the backend public shape (4A toPublicPosting).
// Employer audience only; never imported by seeker/admin code (§0).

export type PostingStatus = 'draft' | 'active' | 'closed';
export type WorkplaceType = 'remote' | 'hybrid' | 'onsite';
export type EmploymentType = 'full-time' | 'part-time' | 'contract' | 'internship';

export interface Posting {
  id: string;
  slug: string;
  title: string;
  description: string;
  descriptionPlain: string;
  location: string;
  workplaceType: WorkplaceType;
  employmentType: EmploymentType;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: 'INR';
  status: PostingStatus;
  postedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PostingCreateInput {
  title: string;
  description: string;
  location: string;
  workplaceType: WorkplaceType;
  employmentType: EmploymentType;
  salaryMin?: number | null;
  salaryMax?: number | null;
  status?: PostingStatus;
}

export type PostingPatch = Partial<PostingCreateInput>;
