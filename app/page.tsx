import { getCompanies, getWorkLogs, getTransportLogs } from "./actions";
import ClientHome from "./ClientPage";
// Force dynamic because we fetch fresh data
export const dynamic = 'force-dynamic';
export default async function Page() {
  const companies = await getCompanies();
  const workLogs = await getWorkLogs();
  const transportLogs = await getTransportLogs();
  return <ClientHome initialCompanies={companies} initialWorkLogs={workLogs} initialTransportLogs={transportLogs} />;
}
