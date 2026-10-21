import "./_group.css";
import "./_modern.css";
import Dashboard from "./_source/dashboard";
import { Layout } from "./_modern-layout";
import { PreviewProvider } from "./_source/runtime";

/** A refreshed visual system over the original WRISTBY dashboard composition. */
export function Modern() {
  return (
    <PreviewProvider>
      <div className="wristby-modern min-h-screen">
        <Layout><Dashboard /></Layout>
      </div>
    </PreviewProvider>
  );
}

export default Modern;
