import "./_group.css";
import "./_refined.css";
import Dashboard from "./_refined/dashboard";
import { Layout } from "./_refined/layout";
import { PreviewProvider } from "./_source/runtime";

/** Refined light dashboard built from the extracted production components. */
export function Refined() {
  return (
    <PreviewProvider>
      <div className="wristby-refined min-h-screen">
        <Layout><Dashboard /></Layout>
      </div>
    </PreviewProvider>
  );
}
