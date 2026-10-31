import { RestrictedSite } from '../types';

const BASE_RULE_ID = 1000;

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
 * Synchronize chrome.declarativeNetRequest dynamic rules.
 * If active is true, rules redirecting blocked domains to /blocked.html are installed.
 * If active is false, all dynamic rules are removed.
 */
export async function syncBlockingRules(sites: RestrictedSite[], isSessionActive: boolean): Promise<void> {
  if (typeof chrome === 'undefined' || !chrome.declarativeNetRequest) {
    console.log('[tabzero Rules] declarativeNetRequest not available (standalone mode).');
    return;
  }

  try {
    const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
    const existingRuleIds = existingRules.map(r => r.id);

    if (!isSessionActive) {
      if (existingRuleIds.length > 0) {
        await chrome.declarativeNetRequest.updateDynamicRules({
          removeRuleIds: existingRuleIds,
          addRules: [],
        });
        console.log(`[tabzero Rules] Detox inactive: Removed ${existingRuleIds.length} dynamic blocking rules.`);
      }
      return;
    }

    const enabledSites = sites.filter(s => s.enabled);
    const newRules: chrome.declarativeNetRequest.Rule[] = [];
    let ruleCounter = 0;

    enabledSites.forEach((site) => {
      const rootDomain = extractRootDomain(site.domain);
      if (!rootDomain) return;

      // Rule for domain and all subdomains (|| matches protocol and subdomain prefix)
      // e.g. ||instagram.com matches http/https, www.instagram.com, m.instagram.com, etc.
      const ruleId = BASE_RULE_ID + (++ruleCounter);

      newRules.push({
        id: ruleId,
        priority: 1,
        action: {
          type: chrome.declarativeNetRequest.RuleActionType.REDIRECT,
          redirect: {
            // NOTE: extensionPath MUST NOT contain query params '?' or '#' per Chrome MV3 specification!
            extensionPath: '/blocked.html',
          },
        },
        condition: {
          urlFilter: `||${rootDomain}`,
          resourceTypes: [
            chrome.declarativeNetRequest.ResourceType.MAIN_FRAME,
          ],
        },
      });
    });

    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: existingRuleIds,
      addRules: newRules,
    });

    console.log(`[tabzero Rules] Detox ACTIVE: Successfully installed ${newRules.length} dynamic declarativeNetRequest rules.`);
  } catch (error) {
    console.error('[tabzero Rules] Critical error updating dynamic rules:', error);
  }
}
