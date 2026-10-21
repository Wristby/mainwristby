import "./_group.css";
import Dashboard from "./_source/dashboard";
import { Layout } from "./_source/layout";
import { PreviewProvider } from "./_source/runtime";

/** Real app source, copied and connected only to synthetic design fixtures. */
export function Current() {
  return <PreviewProvider><div className="wristby-current min-h-screen"><Layout><Dashboard/></Layout></div></PreviewProvider>;
}
