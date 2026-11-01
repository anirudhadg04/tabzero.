import { RestrictedSite } from '../types';
import { getExtensionAPI } from '../services/browserApi';

const BASE_RULE_ID = 1000;

/**
 * Checks whether a URL belongs to internal browser pages or extensions across all engines:
 * Chrome (chrome://, chrome-extension://)
 * Firefox (about:, moz-extension://)
 * Safari (safari:, safari-web-extension://, safari-extension://)
 * Edge (edge://)
 * Brave (brave://)
 * Opera (opera://)
 */
export function isInternalBrowserUrl(url: string): boolean {
  if (!url) return true;
  const lower = url.trim().toLowerCase();
  return (
    lower.startsWith('chrome-extension://') ||
    lower.startsWith('moz-extension://') ||
    lower.startsWith('safari-web-extension://') ||
    lower.startsWith('safari-extension://') ||
    lower.startsWith('chrome://') ||
    lower.startsWith('edge://') ||
    lower.startsWith('brave://') ||
    lower.startsWith('opera://') ||
    lower.startsWith('vivaldi://') ||
    lower.startsWith('about:') ||
    lower.startsWith('safari:') ||
    lower.startsWith('view-source:') ||
    lower.startsWith('data:') ||
    lower.startsWith('blob:') ||
    lower.startsWith('devtools://')
  );
}

/**
 * Extracts normalized root domain (e.g. "instagram.com" from "https://www.instagram.com/p/123", "www.instagram.com", etc.)
 */
export function extractRootDomain(domain: string): string {
  if (!domain) return '';
  let cleaned = domain.trim().toLowerCase();
  // Strip protocol
  cleaned = cleaned.replace(/^[a-zA-Z]+:\/\//, '');
  // Strip path, query params, hash
  cleaned = cleaned.split('/')[0].split('?')[0].split('#')[0];
  // Strip port
  cleaned = cleaned.split(':')[0];
  // Strip leading www, www1, www2, etc.
  cleaned = cleaned.replace(/^www\d*\./, '');
  return cleaned;
}

export function cleanDomain(domain: string): string {
  return extractRootDomain(domain);
}

/**
 * Checks whether a given URL or hostname matches the restricted site or any of its subdomains (e.g. www., m., api., etc.)
 */
export function isDomainBlocked(targetUrlOrHostname: string, siteDomain: string): boolean {
  if (!targetUrlOrHostname || !siteDomain) return false;

  let host = targetUrlOrHostname.trim().toLowerCase();
  try {
    if (host.includes('://')) {
      host = new URL(host).hostname.toLowerCase();
    }
  } catch {
    // fallback
  }

  // Strip path, port, query
  host = host.split('/')[0].split('?')[0].split(':')[0];

  const rootRestricted = extractRootDomain(siteDomain);
  if (!rootRestricted) return false;

  // Exact match (e.g. "instagram.com" === "instagram.com")
  if (host === rootRestricted) return true;

  // Subdomain match (e.g. "www.instagram.com", "m.instagram.com", "l.instagram.com" end with ".instagram.com")
  if (host.endsWith('.' + rootRestricted)) return true;

  return false;
}

/**
 * Synchronize declarativeNetRequest dynamic rules across Chrome, Edge, Brave, Opera, Firefox, Safari.
 * If active is true, rules redirecting blocked domains to /blocked.html are installed.
 * If active is false, all dynamic rules are removed.
 */
export async function syncBlockingRules(sites: RestrictedSite[], isSessionActive: boolean): Promise<void> {
  const api = getExtensionAPI();
  const dnr = api?.declarativeNetRequest;

  if (!dnr || typeof dnr.updateDynamicRules !== 'function') {
    console.log('[tabzero Rules] declarativeNetRequest not available in this environment (standalone/unsupported mode).');
    return;
  }

  try {
    const existingRules = await dnr.getDynamicRules();
    const existingRuleIds = (existingRules || []).map((r: any) => r.id);

    if (!isSessionActive) {
      if (existingRuleIds.length > 0) {
        await dnr.updateDynamicRules({
          removeRuleIds: existingRuleIds,
          addRules: [],
        });
        console.log(`[tabzero Rules] Detox inactive: Removed ${existingRuleIds.length} dynamic blocking rules.`);
      }
      return;
    }

    const enabledSites = sites.filter(s => s.enabled);
    const newRules: any[] = [];
    let ruleCounter = 0;

    // Cross-browser safe action and resource type identifiers
    const actionRedirect = dnr.RuleActionType?.REDIRECT || 'redirect';
    const resourceMainFrame = dnr.ResourceType?.MAIN_FRAME || 'main_frame';

    enabledSites.forEach((site) => {
      const rootDomain = extractRootDomain(site.domain);
      if (!rootDomain) return;

      // Rule for domain and all subdomains (|| matches protocol and subdomain prefix)
      const ruleId = BASE_RULE_ID + (++ruleCounter);

      newRules.push({
        id: ruleId,
        priority: 1,
        action: {
          type: actionRedirect,
          redirect: {
            // NOTE: extensionPath MUST NOT contain query params '?' or '#' per MV3 specifications
            extensionPath: '/blocked.html',
          },
        },
        condition: {
          urlFilter: `||${rootDomain}`,
          resourceTypes: [resourceMainFrame],
        },
      });
    });

    await dnr.updateDynamicRules({
      removeRuleIds: existingRuleIds,
      addRules: newRules,
    });

    console.log(`[tabzero Rules] Detox ACTIVE: Successfully installed ${newRules.length} dynamic declarativeNetRequest rules.`);
  } catch (error) {
    console.error('[tabzero Rules] Error updating dynamic rules:', error);
  }
}
