// FILE: src/app/(seeker)/page.tsx
// Home — Server Component (SEO-critical). Server-fetches latest jobs + the company
// directory, renders Organization + ItemList JSON-LD inline (R4), redirects signed-in
// users to /jobs (mirrors the Vite <Navigate to="/jobs">), then hands the data to the
// client <HomeClient /> which renders the verbatim Vite Home sections (Hero,
// CompaniesCarousel, JobsList).
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { JsonLd } from '../../components/schema/JsonLd';
import { buildOrganizationSchema, buildItemListSchema } from '../../lib/schema';
import { getSeekerMeServer, getSeekerJobsServer, getSeekerDirectoryServer } from '../../lib/server-api/seeker';
import { absoluteUrl } from '../../lib/site-url';
import { BRAND } from '../../theme/brand';
import HomeClient from '../../components/seeker/home/HomeClient';
import type { IJob, ICompany } from '../../types';

export const revalidate = 300; // D_impl_3

export const metadata: Metadata = {
  title: `${BRAND.appName} — ${BRAND.tagline}`,
  description: BRAND.description,
  alternates: { canonical: absoluteUrl('/') },
};

export default async function HomePage() {
  const me = await getSeekerMeServer();
  if (me) redirect('/jobs');

  let jobs: IJob[] = [];
  let companies: ICompany[] = [];
  try {
    [jobs, companies] = await Promise.all([getSeekerJobsServer(8), getSeekerDirectoryServer()]);
  } catch {
    // A backend hiccup must not break the public shell; render an empty state.
  }
  jobs = jobs.slice(0, 8);
  companies = companies.slice(0, 10);

  const organizationSchema = buildOrganizationSchema();
  const itemListSchema = buildItemListSchema(
    jobs.map((job) => ({ path: `/jobs/${job._id}`, name: job.JobTitle })),
  );

  return (
    <>
      <JsonLd schema={organizationSchema} />
      <JsonLd schema={itemListSchema} />
      <HomeClient jobs={jobs} companies={companies} />
    </>
  );
}
