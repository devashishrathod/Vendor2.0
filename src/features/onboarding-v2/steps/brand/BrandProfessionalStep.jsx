import { useCallback, useState } from "react";
import { ArrowRight, Images, Sparkles, TriangleAlert } from "lucide-react";
import ShowcaseAlbumsEditor from "@/features/oulet/New folder/components/brandOutlet/ShowcaseAlbumsEditor";
import Button from "../../components/ui/Button";
import FormError from "../../components/ui/FormError";
import Notice from "../../components/ui/Notice";
import StepCard from "../../components/ui/StepCard";
import StepFooter from "../../components/ui/StepFooter";
import { SCREENS } from "../../config/screens";
import { useOnboardingFlow } from "../../hooks/useOnboardingFlow";
import { continueScreen, skipScreen } from "../../services/onboardingApi";
import { onboardingErrorMessage } from "../../utils/errorMessages";
import FeaturesEditor from "./FeaturesEditor";

/** A titled block inside the step card. */
function Section({ icon: Icon, title, subtitle, children }) {
  return (
    <section className="flex flex-col gap-3 rounded-2xl bg-white p-4 ring-1 ring-inset ring-gray-200 dark:bg-gray-900 dark:ring-gray-800">
      <div className="flex items-start gap-2.5">
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
          <Icon size={16} aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-sm font-extrabold text-gray-900 dark:text-gray-100">{title}</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

/**
 * BRAND_PROFESSIONAL_DETAILS (guide §4.12): listing features (limit
 * `status.limits.maxActiveFeatures`) and showcase albums (count from the plan,
 * minimum photos from settings — both enforced by the server), each saved
 * through its own API. Then `continue`, or `skip` when nothing was added.
 * When `requireShowcase` is on and no album is visible yet, skipping warns
 * first that the brand won't show to customers.
 */
export default function BrandProfessionalStep() {
  const { status, limits, isViewingPast, closeScreen, goToServerScreen, handleFlowError } = useOnboardingFlow();
  const [featureCount, setFeatureCount] = useState(0);
  const [albums, setAlbums] = useState([]);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [showcaseWarned, setShowcaseWarned] = useState(false);

  const canAdd = status?.editable?.setup?.add !== false;
  const canChange = status?.editable?.setup?.change !== false;
  const hints = status?.customerVisibilityHints;
  const showcaseRequired = Boolean(hints?.requireShowcase && hints?.reasons?.includes("NO_VISIBLE_SHOWCASE"));
  const albumCount = albums.filter((a) => a.persisted).length;
  const hasContent = featureCount > 0 || albumCount > 0;

  const move = useCallback(
    async (kind, call) => {
      setBusy(kind);
      setError("");
      try {
        const res = await call();
        goToServerScreen(res?.data?.currentScreen);
      } catch (err) {
        if (handleFlowError(err)) return;
        console.error(`Brand professional ${kind} failed:`, err);
        setError(onboardingErrorMessage(err, "That didn't work. Please try again."));
      } finally {
        setBusy("");
      }
    },
    [goToServerScreen, handleFlowError],
  );

  const handleSkip = useCallback(() => {
    if (showcaseRequired && !showcaseWarned) {
      setShowcaseWarned(true);
      return;
    }
    move("skip", () => skipScreen(SCREENS.BRAND_PROFESSIONAL_DETAILS));
  }, [move, showcaseRequired, showcaseWarned]);

  let actions;
  if (isViewingPast) {
    actions = (
      <Button onClick={closeScreen} icon={ArrowRight}>
        Done
      </Button>
    );
  } else if (hasContent) {
    actions = (
      <Button onClick={() => move("continue", continueScreen)} loading={busy === "continue"} icon={ArrowRight}>
        Continue to outlets
      </Button>
    );
  } else {
    actions = (
      <Button variant="secondary" onClick={handleSkip} loading={busy === "skip"}>
        {showcaseWarned ? "Skip anyway" : "Skip for now"}
      </Button>
    );
  }

  return (
    <StepCard
      icon={Sparkles}
      title="Make your listing stand out"
      subtitle="Features and photo albums help customers choose you. Both are optional — you can add them later too."
      footer={
        <StepFooter start={<FormError message={error} />}>
          {actions}
        </StepFooter>
      }
    >
      {showcaseRequired && (
        <Notice tone="warning" icon={TriangleAlert} title="An album is needed to be seen">
          Customers won&apos;t see your brand until it has a visible showcase album with enough photos.
        </Notice>
      )}

      <Section icon={Sparkles} title="Listing features" subtitle="Short highlights shown on your brand page.">
        {status?.brandId && (
          <FeaturesEditor
            brandId={status.brandId}
            limit={limits?.maxActiveFeatures ?? null}
            canAdd={canAdd}
            canChange={canChange}
            onCountChange={setFeatureCount}
          />
        )}
      </Section>

      <Section icon={Images} title="Showcase albums" subtitle="Photos and videos of your place. Your plan decides how many albums you can have.">
        {status?.brandId && <ShowcaseAlbumsEditor albums={albums} onChange={setAlbums} brandId={status.brandId} />}
      </Section>
    </StepCard>
  );
}
