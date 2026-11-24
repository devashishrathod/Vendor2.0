import GstPanSection from "../components/GstPanSection";
import useProfileRefresh from "../hooks/useProfileRefresh";

/**
 * GstPanPage
 * "Business Profile" tab — GST and PAN (read-only once saved; a missing one
 * can be added once), and the unregistered → registered upgrade (guide §8).
 * A save re-reads the brand and the onboarding status.
 */
const GstPanPage = ({ brand, reload }) => {
  const refresh = useProfileRefresh(reload);
  return <GstPanSection brand={brand} onUpdated={refresh} />;
};

export default GstPanPage;
