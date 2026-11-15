// Claude cloud sandbox only (see .claude/commands/prove.md). Not used by the app, CI or laptops.
// Test-only: firebase-tools' apiv2 builds an undici ProxyAgent from HTTPS_PROXY and
// ignores NO_PROXY, so emulator-to-emulator calls on 127.0.0.1 hit the sandbox proxy.
// Swap ProxyAgent for undici's EnvHttpProxyAgent, which honours NO_PROXY.
const Module = require("module");
const load = Module._load;
Module._load = function (req, parent, isMain) {
  const m = load.apply(this, arguments);
  if (req === "undici" && m && m.EnvHttpProxyAgent && !m.__noProxyShim) {
    const Env = m.EnvHttpProxyAgent;
    m.ProxyAgent = class extends Env { constructor() { super(); } };
    m.__noProxyShim = true;
  }
  return m;
};

// Test-only: the repo's Playwright expects a newer Chromium build than this sandbox ships;
// point launches at the preinstalled browser.
{
  const prev = Module._load;
  Module._load = function (req) {
    const m = prev.apply(this, arguments);
    if (process.env.PW_EXEC && m && m.chromium && m.chromium.launch && !m.chromium.__execShim) {
      const launch = m.chromium.launch.bind(m.chromium);
      m.chromium.launch = (opts = {}) => launch({ ...opts, channel: undefined, executablePath: process.env.PW_EXEC });
      m.chromium.__execShim = true;
    }
    return m;
  };
}
