/**
 * Service for fetching metadata from the openscan-explorer/explorer-metadata repository
 */

const METADATA_BASE_URL =
  "https://raw.githubusercontent.com/openscan-explorer/explorer-metadata/main/dist";

export interface NetworkLink {
  name: string;
  url: string;
  description?: string;
}

export interface NetworkSubscription {
  tier: 1 | 2 | 3; // 1: Backer, 2: Partner, 3: Ally
  expiresAt: string; // YYYY-MM-DD format
}

export interface NetworkExplorer {
  subdomain?: string;
  features?: string[];
  priority?: number;
}

export interface NetworkMetadata {
  chainId: number;
  name: string;
  shortName: string;
  description?: string;
  currency: string;
  color?: string;
  isTestnet?: boolean;
  subscription?: NetworkSubscription;
  logo?: string;
  profile?: string;
  explorer?: NetworkExplorer;
  rpc?: {
    public: string[];
  };
  links?: NetworkLink[];
}

export interface NetworksResponse {
  updatedAt: string;
  networks: NetworkMetadata[];
}

// Cache for fetched data
let networksCache: NetworksResponse | null = null;
let networksCacheTime: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch network configurations from the metadata repository
 */
export async function fetchNetworks(): Promise<NetworksResponse> {
  const now = Date.now();

  // Return cached data if still valid
  if (networksCache && now - networksCacheTime < CACHE_DURATION) {
    return networksCache;
  }

  try {
    const response = await fetch(`${METADATA_BASE_URL}/networks.json`);

    if (!response.ok) {
      throw new Error(`Failed to fetch networks: ${response.statusText}`);
    }

    const data: NetworksResponse = await response.json();

    // Update cache
    networksCache = data;
    networksCacheTime = now;

    return data;
  } catch (error) {
    console.error("Error fetching networks from metadata:", error);

    // Return cached data if available, even if stale
    if (networksCache) {
      return networksCache;
    }

    throw error;
  }
}

/**
 * Get the logo URL for a network
 */
export function getNetworkLogoUrl(logoPath: string): string {
  if (logoPath.startsWith("http")) {
    return logoPath;
  }
  return `${METADATA_BASE_URL}/${logoPath}`;
}

/**
 * Clear the networks cache (useful for testing or forced refresh)
 */
export function clearNetworksCache(): void {
  networksCache = null;
  networksCacheTime = 0;
}

/**
 * Fetch network profile markdown content
 */
export async function fetchNetworkProfile(profilePath: string): Promise<string | null> {
  if (!profilePath) {
    return null;
  }

  try {
    const url = profilePath.startsWith("http")
      ? profilePath
      : `${METADATA_BASE_URL}/${profilePath}`;
    const response = await fetch(url);

    if (!response.ok) {
      console.warn(`Failed to fetch network profile: ${response.statusText}`);
      return null;
    }

    return await response.text();
  } catch (error) {
    console.error("Error fetching network profile:", error);
    return null;
  }
}

/**
 * Check if a network subscription is active
 */
export function isSubscriptionActive(subscription?: NetworkSubscription): boolean {
  if (!subscription) {
    return false;
  }

  const expiresAt = new Date(subscription.expiresAt);
  return expiresAt > new Date();
}

/**
 * Get subscription tier name
 */
export function getSubscriptionTierName(tier: 1 | 2 | 3): string {
  switch (tier) {
    case 1:
      return "Backer";
    case 2:
      return "Partner";
    case 3:
      return "Ally";
    default:
      return "Unknown";
  }
}

/**
 * Supporter type from the metadata repository
 */
export type SupporterType = "network" | "app" | "organization" | "token";

/**
 * Supporter information from the metadata repository
 */
export interface Supporter {
  id: string;
  type: SupporterType;
  chainId?: number;
  tokenAddress?: string;
  name: string;
  startedAt: string;
  currentTier: 1 | 2 | 3;
  tierName: string;
  expiresAt: string;
  logo?: string;
  color?: string;
}

/**
 * Response from supporters.json
 */
export interface SupportersResponse {
  updatedAt: string;
  count: number;
  supporters: Array<{
    id: string;
    type: SupporterType;
    chainId?: number;
    tokenAddress?: string;
    name: string;
    startedAt: string;
    currentTier: 1 | 2 | 3;
    expiresAt: string;
  }>;
}

// Cache for supporters data
let supportersCache: SupportersResponse | null = null;
let supportersCacheTime: number = 0;

/**
 * Check if a supporter subscription is active
 */
export function isSupporterActive(expiresAt: string): boolean {
  const expires = new Date(expiresAt);
  return expires > new Date();
}

/**
 * Fetch all supporters from the metadata repository
 */
export async function fetchSupporters(): Promise<Supporter[]> {
  const now = Date.now();

  // Return cached data if still valid
  if (supportersCache && now - supportersCacheTime < CACHE_DURATION) {
    return processSupporters(supportersCache);
  }

  try {
    const response = await fetch(`${METADATA_BASE_URL}/supporters.json`);

    if (!response.ok) {
      throw new Error(`Failed to fetch supporters: ${response.statusText}`);
    }

    const data: SupportersResponse = await response.json();

    // Update cache
    supportersCache = data;
    supportersCacheTime = now;

    return processSupporters(data);
  } catch (error) {
    console.error("Error fetching supporters:", error);

    // Return cached data if available, even if stale
    if (supportersCache) {
      return processSupporters(supportersCache);
    }

    return [];
  }
}

/**
 * Process supporters response and enrich with additional data
 */
async function processSupporters(data: SupportersResponse): Promise<Supporter[]> {
  // Get networks data for logo and color information
  let networksMap: Map<number, NetworkMetadata> = new Map();
  let appsMap: Map<string, AppMetadata> = new Map();
  let orgsMap: Map<string, OrganizationMetadata> = new Map();

  try {
    const { networks } = await fetchNetworks();
    networksMap = new Map(networks.map((n) => [n.chainId, n]));
  } catch {
    // Continue without network data
  }

  try {
    const { apps } = await fetchApps();
    appsMap = new Map(apps.map((a) => [a.id.toLowerCase(), a]));
  } catch {
    // Continue without apps data
  }

  try {
    const { organizations } = await fetchOrganizations();
    orgsMap = new Map(organizations.map((o) => [o.id.toLowerCase(), o]));
  } catch {
    // Continue without organizations data
  }

  const supporters: Supporter[] = data.supporters
    .filter((s) => isSupporterActive(s.expiresAt))
    .map((s) => {
      let logo: string | undefined;
      let color: string | undefined;

      // Get logo and color based on supporter type
      switch (s.type) {
        case "network": {
          const network = s.chainId ? networksMap.get(s.chainId) : undefined;
          logo = network?.logo ? getAssetUrl(network.logo) : undefined;
          color = network?.color;
          break;
        }
        case "app": {
          const app = appsMap.get(s.id.toLowerCase());
          logo = app?.logo ? getAssetUrl(app.logo) : undefined;
          break;
        }
        case "organization": {
          const org = orgsMap.get(s.id.toLowerCase());
          logo = org?.logo ? getAssetUrl(org.logo) : undefined;
          break;
        }
        case "token": {
          // Token logos are at assets/tokens/{chainId}/{address}.png
          if (s.chainId) {
            logo = getAssetUrl(`assets/tokens/${s.chainId}/${s.id.toLowerCase()}.png`);
          }
          break;
        }
      }

      return {
        id: s.id,
        type: s.type,
        chainId: s.chainId,
        tokenAddress: s.tokenAddress,
        name: s.name,
        startedAt: s.startedAt,
        currentTier: s.currentTier,
        tierName: getSubscriptionTierName(s.currentTier),
        expiresAt: s.expiresAt,
        logo,
        color,
      };
    })
    // Sort by tier (higher tier first), then by name
    .sort((a, b) => {
      if (b.currentTier !== a.currentTier) {
        return b.currentTier - a.currentTier;
      }
      return a.name.localeCompare(b.name);
    });

  return supporters;
}

/**
 * Clear the supporters cache
 */
export function clearSupportersCache(): void {
  supportersCache = null;
  supportersCacheTime = 0;
}

// ============================================
// Profile Types and Functions
// ============================================

/**
 * Profile type
 */
export type ProfileType = "network" | "app" | "organization" | "token";

/**
 * Common link structure
 */
export interface ProfileLink {
  name: string;
  url: string;
  description?: string;
}

/**
 * App metadata from apps.json
 */
export interface AppMetadata {
  id: string;
  name: string;
  type: string;
  description?: string;
  subscription?: NetworkSubscription;
  verified?: boolean;
  logo?: string;
  profile?: string;
  networks?: number[];
  links?: ProfileLink[];
  tags?: string[];
}

/**
 * Organization metadata from organizations.json
 */
export interface OrganizationMetadata {
  id: string;
  name: string;
  type: string;
  description?: string;
  subscription?: NetworkSubscription;
  logo?: string;
  profile?: string;
  links?: ProfileLink[];
}

/**
 * Apps response from apps.json
 */
export interface AppsResponse {
  updatedAt: string;
  count: number;
  apps: AppMetadata[];
}

/**
 * Organizations response from organizations.json
 */
export interface OrganizationsResponse {
  updatedAt: string;
  count: number;
  organizations: OrganizationMetadata[];
}

/**
 * Token metadata from tokens/{chainId}/{address}.json
 */
export interface TokenMetadata {
  address: string;
  chainId: number;
  name: string;
  symbol: string;
  decimals: number;
  type?: "ERC20" | "ERC721" | "ERC1155";
  totalSupply?: number;
  subscription?: NetworkSubscription;
  verified?: boolean;
  logo?: string;
  profile?: string;
  project?: {
    name: string;
    description?: string;
  };
  links?: ProfileLink[];
  networks?: Array<{ chainId: number; address: string }>;
  tags?: string[];
}

/**
 * Unified profile data structure
 */
export interface ProfileData {
  type: ProfileType;
  id: string;
  name: string;
  description?: string;
  subscription?: NetworkSubscription;
  logo?: string;
  logoUrl?: string;
  profileMarkdown?: string;
  links?: ProfileLink[];
  // Network-specific fields
  chainId?: number;
  currency?: string;
  color?: string;
  isTestnet?: boolean;
  rpc?: { public: string[] };
  // App-specific fields
  verified?: boolean;
  networks?: number[];
  tags?: string[];
  // Organization-specific fields
  orgType?: string;
  // Token-specific fields
  tokenAddress?: string;
  symbol?: string;
  decimals?: number;
  tokenType?: "ERC20" | "ERC721" | "ERC1155";
  projectName?: string;
  otherNetworks?: Array<{ chainId: number; address: string }>;
}

// Cache for apps and organizations
let appsCache: AppsResponse | null = null;
let appsCacheTime: number = 0;
let orgsCache: OrganizationsResponse | null = null;
let orgsCacheTime: number = 0;

/**
 * Fetch apps from the metadata repository
 */
export async function fetchApps(): Promise<AppsResponse> {
  const now = Date.now();

  if (appsCache && now - appsCacheTime < CACHE_DURATION) {
    return appsCache;
  }

  try {
    const response = await fetch(`${METADATA_BASE_URL}/apps.json`);

    if (!response.ok) {
      throw new Error(`Failed to fetch apps: ${response.statusText}`);
    }

    const data: AppsResponse = await response.json();
    appsCache = data;
    appsCacheTime = now;
    return data;
  } catch (error) {
    console.error("Error fetching apps:", error);
    if (appsCache) {
      return appsCache;
    }
    throw error;
  }
}

/**
 * Fetch organizations from the metadata repository
 */
export async function fetchOrganizations(): Promise<OrganizationsResponse> {
  const now = Date.now();

  if (orgsCache && now - orgsCacheTime < CACHE_DURATION) {
    return orgsCache;
  }

  try {
    const response = await fetch(`${METADATA_BASE_URL}/organizations.json`);

    if (!response.ok) {
      throw new Error(`Failed to fetch organizations: ${response.statusText}`);
    }

    const data: OrganizationsResponse = await response.json();
    orgsCache = data;
    orgsCacheTime = now;
    return data;
  } catch (error) {
    console.error("Error fetching organizations:", error);
    if (orgsCache) {
      return orgsCache;
    }
    throw error;
  }
}

/**
 * Fetch profile markdown content
 */
export async function fetchProfileMarkdown(profilePath: string): Promise<string | null> {
  if (!profilePath) {
    return null;
  }

  try {
    const url = profilePath.startsWith("http")
      ? profilePath
      : `${METADATA_BASE_URL}/${profilePath}`;
    const response = await fetch(url);

    if (!response.ok) {
      console.warn(`Failed to fetch profile markdown: ${response.statusText}`);
      return null;
    }

    return await response.text();
  } catch (error) {
    console.error("Error fetching profile markdown:", error);
    return null;
  }
}

/**
 * Get asset URL from path
 */
export function getAssetUrl(assetPath: string): string {
  if (assetPath.startsWith("http")) {
    return assetPath;
  }
  return `${METADATA_BASE_URL}/${assetPath}`;
}

/**
 * Fetch token metadata from tokens/{chainId}/{address}.json
 */
export async function fetchToken(chainId: number, address: string): Promise<TokenMetadata | null> {
  try {
    const response = await fetch(
      `${METADATA_BASE_URL}/tokens/${chainId}/${address.toLowerCase()}.json`,
    );

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching token:", error);
    return null;
  }
}

/**
 * Fetch a profile by type and ID
 */
export async function fetchProfile(
  profileType: ProfileType,
  profileId: string,
): Promise<ProfileData | null> {
  try {
    let profileData: ProfileData | null = null;

    switch (profileType) {
      case "network": {
        const { networks } = await fetchNetworks();
        const network = networks.find(
          (n) =>
            n.chainId.toString() === profileId ||
            n.shortName.toLowerCase() === profileId.toLowerCase(),
        );
        if (network) {
          profileData = {
            type: "network",
            id: network.chainId.toString(),
            name: network.name,
            description: network.description,
            subscription: network.subscription,
            logo: network.logo,
            logoUrl: network.logo ? getAssetUrl(network.logo) : undefined,
            links: network.links,
            chainId: network.chainId,
            currency: network.currency,
            color: network.color,
            isTestnet: network.isTestnet,
            rpc: network.rpc,
          };
          if (network.profile) {
            profileData.profileMarkdown =
              (await fetchProfileMarkdown(network.profile)) ?? undefined;
          }
        }
        break;
      }

      case "app": {
        const { apps } = await fetchApps();
        const app = apps.find((a) => a.id.toLowerCase() === profileId.toLowerCase());
        if (app) {
          profileData = {
            type: "app",
            id: app.id,
            name: app.name,
            description: app.description,
            subscription: app.subscription,
            logo: app.logo,
            logoUrl: app.logo ? getAssetUrl(app.logo) : undefined,
            links: app.links,
            verified: app.verified,
            networks: app.networks,
            tags: app.tags,
          };
          if (app.profile) {
            profileData.profileMarkdown = (await fetchProfileMarkdown(app.profile)) ?? undefined;
          }
        }
        break;
      }

      case "organization": {
        const { organizations } = await fetchOrganizations();
        const org = organizations.find((o) => o.id.toLowerCase() === profileId.toLowerCase());
        if (org) {
          profileData = {
            type: "organization",
            id: org.id,
            name: org.name,
            description: org.description,
            subscription: org.subscription,
            logo: org.logo,
            logoUrl: org.logo ? getAssetUrl(org.logo) : undefined,
            links: org.links,
            orgType: org.type,
          };
          if (org.profile) {
            profileData.profileMarkdown = (await fetchProfileMarkdown(org.profile)) ?? undefined;
          }
        }
        break;
      }

      case "token": {
        // profileId format: chainId/address (e.g., "1/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48")
        const parts = profileId.split("/");
        const chainIdStr = parts[0];
        const tokenAddress = parts[1];
        const chainId = chainIdStr ? Number.parseInt(chainIdStr, 10) : undefined;
        if (chainId && tokenAddress) {
          const token = await fetchToken(chainId, tokenAddress);
          if (token) {
            profileData = {
              type: "token",
              id: token.address,
              name: token.name,
              description: token.project?.description,
              subscription: token.subscription,
              logo: token.logo,
              logoUrl: token.logo
                ? getAssetUrl(token.logo)
                : getAssetUrl(`assets/tokens/${chainId}/${token.address.toLowerCase()}.png`),
              links: token.links,
              chainId: token.chainId,
              verified: token.verified,
              tags: token.tags,
              tokenAddress: token.address,
              symbol: token.symbol,
              decimals: token.decimals,
              tokenType: token.type,
              projectName: token.project?.name,
              otherNetworks: token.networks,
            };
            if (token.profile) {
              profileData.profileMarkdown =
                (await fetchProfileMarkdown(token.profile)) ?? undefined;
            }
          }
        }
        break;
      }
    }

    return profileData;
  } catch (error) {
    console.error(`Error fetching ${profileType} profile:`, error);
    return null;
  }
}
