'use client';
// FILE: src/components/seeker/home/HomeClient.tsx
// Client shell for the guest landing page. The server page fetches jobs + the
// company directory and passes them in (SSR/SEO), so there is no on-mount fetch or
// loading state — the sections render immediately. Composes Hero + CompaniesCarousel
// + JobsList, mirroring the Vite Home/index.tsx composition.
import type { IJob, ICompany } from '../../../types';
import Hero from './Hero';
import CompaniesCarousel from './CompaniesCarousel';
import JobsList from './JobsList';

interface Props { jobs: IJob[]; companies: ICompany[]; }

export default function HomeClient({ jobs, companies }: Props) {
  return (
    <>
      <Hero />
      <CompaniesCarousel companies={companies} loading={false} />
      <JobsList jobs={jobs} loading={false} />
    </>
  );
}
