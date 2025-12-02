import type React from "react";
import { useState } from "react";
import paymentHelp1 from "../../assets/paymentHelp1.png";
import paymentHelp2 from "../../assets/paymentHelp2.png";
import paymentHelp3 from "../../assets/paymentHelp3.png";
import { OPENSCAN_PAYMENT_ADDRESS } from "../../config/index";
import "../../styles/subscriptions.css";

type SubscriptionCategory = "tokens" | "networks" | "apps" | "companies";

interface TierBenefit {
  tier: string;
  benefits: string[];
}

interface SubscriptionType {
  id: SubscriptionCategory;
  name: string;
  basePrice: number;
  description: string;
  tiers: TierBenefit[];
}

const subscriptionTypes: SubscriptionType[] = [
  {
    id: "tokens",
    name: "Tokens",
    basePrice: 500,
    description:
      "Verified contracts tags, metadata integration, logo display, official links and token balance fetcher integration.",
    tiers: [
      {
        tier: "Backer",
        benefits: [
          "Token page with token info: ERC20 details, project name, custom URLs",
          "Verified contracts and tagged important contracts",
        ],
      },
      {
        tier: "Partner",
        benefits: ["Token balance shown on the main explorer", "Simple profile page"],
      },
      {
        tier: "Ally",
        benefits: [
          "Complete profile page with markdown description",
          "Direct communication line with the technical team",
        ],
      },
    ],
  },
  {
    id: "networks",
    name: "Networks",
    basePrice: 2000,
    description:
      "Full RPC methods support, dedicated technical maintenance, subdomain availability, and prominent branding.",
    tiers: [
      {
        tier: "Backer",
        benefits: ["Markdown profile on the network page", "Priority placement on the home page"],
      },
      {
        tier: "Partner",
        benefits: [
          "Dedicated subdomain network explorer",
          "Direct communication line with the technical team",
        ],
      },
      {
        tier: "Ally",
        benefits: [
          "Roadmap voting power",
          "Network-specific features in the dedicated network explorer",
        ],
      },
    ],
  },
  {
    id: "apps",
    name: "Crypto Apps",
    basePrice: 1000,
    description:
      "Dedicated listing and verified branding for wallets, dApps, supplementary explorer tools, and exchanges, promoting integration and visibility.",
    tiers: [
      {
        tier: "Backer",
        benefits: [
          "Simple profile page",
          "Important contracts verified and tagged",
          "Contract events listing",
        ],
      },
      {
        tier: "Partner",
        benefits: ["OpenScan subdomain", "Complete profile page with markdown description"],
      },
      {
        tier: "Ally",
        benefits: ["Roadmap voting power", "Direct communication line with the technical team"],
      },
    ],
  },
  {
    id: "companies",
    name: "Companies & Orgs",
    basePrice: 500,
    description:
      "Formal recognition and visibility for infrastructure providers, venture funds, and other supporting entities who contribute to the project's continuity.",
    tiers: [
      {
        tier: "Backer",
        benefits: [
          "Simple profile page",
          "Important contracts verified and tagged",
          "Contract events listing",
        ],
      },
      {
        tier: "Partner",
        benefits: [
          "Complete profile page with markdown description",
          "Direct communication line with the technical team",
        ],
      },
      {
        tier: "Ally",
        benefits: ["OpenScan subdomain", "Roadmap voting power"],
      },
    ],
  },
];

const tierMultipliers: Record<string, number> = {
  Backer: 1,
  Partner: 3,
  Ally: 6,
};

// Early adopter discount periods with graduated rates
const EARLY_ADOPTER_PERIODS = [
  {
    start: new Date("2026-01-01T00:00:00"),
    end: new Date("2026-01-31T23:59:59"),
    discount: 0.4, // 40% off
    label: "January 2026",
  },
  {
    start: new Date("2026-02-01T00:00:00"),
    end: new Date("2026-02-28T23:59:59"),
    discount: 0.3, // 30% off
    label: "February 2026",
  },
  {
    start: new Date("2026-03-01T00:00:00"),
    end: new Date("2026-03-31T23:59:59"),
    discount: 0.2, // 20% off
    label: "March 2026",
  },
];

const getCurrentEarlyAdopterDiscount = (): number | null => {
  const now = new Date();
  for (const period of EARLY_ADOPTER_PERIODS) {
    if (now >= period.start && now <= period.end) {
      return period.discount;
    }
  }
  return null;
};

const isEarlyAdopterPeriod = (): boolean => {
  return getCurrentEarlyAdopterDiscount() !== null;
};

const Subscriptions: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<SubscriptionCategory>("tokens");
  const [showHelpImages, setShowHelpImages] = useState(false);

  const selectedSubscription = subscriptionTypes.find((s) => s.id === selectedCategory);

  const earlyAdopterActive = isEarlyAdopterPeriod();

  return (
    <div className="container-medium page-container-padded">
      <div className="page-card">
        {/* Header */}
        <div className="text-center mb-large">
          <h1 className="page-heading">Support OpenScan</h1>
          <p className="page-subtitle">
            Sustainable, ethical funding for open-source blockchain infrastructure
          </p>
        </div>

        {/* Value Proposition */}
        <div className="subscriptions-intro">
          <p>
            OpenScan remains <strong>entirely free for all end-users</strong>. Revenue is sourced
            from projects, applications, tokens, and networks that recognize the value of the
            platform and wish to formally appear as verified supporters of the open ecosystem.
          </p>
        </div>

        {/* Category Tabs */}
        <div className="subscriptions-tabs">
          {subscriptionTypes.map((sub) => (
            // biome-ignore lint/a11y/useButtonType: tab buttons don't need explicit type
            <button
              key={sub.id}
              className={`subscriptions-tab ${selectedCategory === sub.id ? "active" : ""}`}
              onClick={() => setSelectedCategory(sub.id)}
            >
              {sub.name}
            </button>
          ))}
        </div>

        {/* Selected Category Description */}
        {selectedSubscription && (
          <div className="subscriptions-category-info">
            <p className="subscriptions-category-description">{selectedSubscription.description}</p>
          </div>
        )}

        {/* Pricing Tiers */}
        {selectedSubscription && (
          <div className="subscriptions-tiers">
            {selectedSubscription.tiers.map((tier) => {
              const multiplier = tierMultipliers[tier.tier] ?? 1;
              const price = selectedSubscription.basePrice * multiplier;
              return (
                <div key={tier.tier} className="subscriptions-tier-card">
                  <div className="subscriptions-tier-header">
                    <h3 className="subscriptions-tier-name">
                      Tier {Object.keys(tierMultipliers).indexOf(tier.tier) + 1} - {tier.tier}
                    </h3>
                    <div className="subscriptions-tier-price">
                      <span className="subscriptions-price-amount">${price.toLocaleString()}</span>
                      <span className="subscriptions-price-period">/ month</span>
                    </div>
                    <div className="subscriptions-tier-price-annual">
                      <span className="subscriptions-price-annual-amount">
                        ${(price * 12 * 0.8).toLocaleString()}
                      </span>
                      <span className="subscriptions-price-annual-period">/ year</span>
                      <span className="subscriptions-price-annual-discount">Save 20%</span>
                    </div>
                  </div>
                  <div className="subscriptions-tier-benefits">
                    <ul>
                      {tier.benefits.map((benefit, index) => (
                        // biome-ignore lint/suspicious/noArrayIndexKey: benefits are static strings
                        <li key={index}>{benefit}</li>
                      ))}
                    </ul>
                  </div>
                  {tier.tier !== "Backer" && (
                    <div className="subscriptions-tier-note">
                      Includes all {tier.tier === "Ally" ? "Partner" : "Backer"} benefits
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Pricing Summary Table */}
        <div className="subscriptions-summary">
          <h2 className="page-heading-large text-center">Pricing Overview</h2>

          {/* Early Adopter Discount Banner */}
          <div className="subscriptions-early-adopter">
            <div className="subscriptions-early-adopter-badge">Early Adopter Discount</div>
            <div className="subscriptions-early-adopter-content">
              <p className="subscriptions-early-adopter-title">
                Limited time discounts on all subscriptions
              </p>
              <div className="subscriptions-early-adopter-tiers">
                {EARLY_ADOPTER_PERIODS.map((period, idx) => {
                  const now = new Date();
                  const isActive = now >= period.start && now <= period.end;
                  const isPast = now > period.end;
                  return (
                    <div
                      // biome-ignore lint/suspicious/noArrayIndexKey: periods are static constants
                      key={idx}
                      className={`subscriptions-early-adopter-tier ${isActive ? "active" : ""} ${isPast ? "past" : ""}`}
                    >
                      <span className="subscriptions-early-adopter-tier-discount">
                        {period.discount * 100}% off
                      </span>
                      <span className="subscriptions-early-adopter-tier-month">{period.label}</span>
                    </div>
                  );
                })}
              </div>
              {earlyAdopterActive && (
                <p className="subscriptions-early-adopter-status">
                  <span className="subscriptions-early-adopter-active">Active now</span> -{" "}
                  {/* biome-ignore lint/style/noNonNullAssertion: earlyAdopterActive guarantees non-null */}
                  {getCurrentEarlyAdopterDiscount()! * 100}% discount available
                </p>
              )}
            </div>
          </div>

          <div className="subscriptions-table-wrapper">
            <table className="subscriptions-table">
              <thead>
                <tr>
                  <th>Subscription Type</th>
                  <th>Backer</th>
                  <th>Partner (3x)</th>
                  <th>Ally (6x)</th>
                </tr>
              </thead>
              <tbody>
                {subscriptionTypes.map((sub) => {
                  const tierPrices = [1, 3, 6].map((multiplier) => {
                    const monthly = sub.basePrice * multiplier;
                    return {
                      monthly,
                      earlyAdopterPrices: EARLY_ADOPTER_PERIODS.map((p) => ({
                        price: monthly * (1 - p.discount),
                        discount: p.discount,
                        label: p.label,
                      })),
                      annual: monthly * 12 * 0.8,
                    };
                  });
                  return (
                    <tr key={sub.id}>
                      <td className="subscriptions-table-type">{sub.name}</td>
                      {tierPrices.map((tp, idx) => (
                        // biome-ignore lint/suspicious/noArrayIndexKey: tier prices are computed from static multipliers
                        <td key={idx}>
                          <div className="subscriptions-table-monthly">
                            ${tp.monthly.toLocaleString()}/mo
                          </div>
                          <div className="subscriptions-table-early-adopter-list">
                            {tp.earlyAdopterPrices.map((ea, eaIdx) => (
                              // biome-ignore lint/suspicious/noArrayIndexKey: early adopter prices are static
                              <div key={eaIdx} className="subscriptions-table-early-adopter-item">
                                <span className="subscriptions-table-ea-price">
                                  ${ea.price.toLocaleString()}
                                </span>
                                <span className="subscriptions-table-ea-discount">
                                  -{ea.discount * 100}%
                                </span>
                              </div>
                            ))}
                          </div>
                          <div className="subscriptions-table-annual">
                            ${tp.annual.toLocaleString()}/yr
                          </div>
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Shared Roadmap Planning */}
        <div className="subscriptions-governance">
          <h2 className="page-heading-large text-center">Shared Roadmap Planning</h2>
          <p>
            Ally-tier subscribers gain voting power in our bi-annual roadmap planning sessions,
            where the OpenScan team and Allies collaborate to shape the future of the platform.
          </p>
          <div className="subscriptions-roadmap-features">
            <div className="subscriptions-roadmap-item">
              <h4>Feature Prioritization</h4>
              <p>
                Vote on which features and improvements get developed next based on community needs.
              </p>
            </div>
            <div className="subscriptions-roadmap-item">
              <h4>Network Expansion</h4>
              <p>Help decide which blockchain networks OpenScan should support and integrate.</p>
            </div>
            <div className="subscriptions-roadmap-item">
              <h4>Strategic Direction</h4>
              <p>
                Participate in discussions about OpenScan's long-term vision and technical
                direction.
              </p>
            </div>
          </div>
        </div>

        {/* How to Subscribe */}
        <div className="subscriptions-how-to">
          <h2 className="page-heading-large text-center">How to Subscribe</h2>
          <div className="subscriptions-steps">
            <div className="subscriptions-step">
              <div className="subscriptions-step-number">1</div>
              <div className="subscriptions-step-content">
                <h4>Make Payment</h4>
                <p>
                  Send your subscription payment to the <strong>openscan-payment</strong> contract
                  on Ethereum Mainnet.
                </p>
              </div>
            </div>
            <div className="subscriptions-step">
              <div className="subscriptions-step-number">2</div>
              <div className="subscriptions-step-content">
                <h4>Sign Payment Transaction</h4>
                <p>
                  Use OpenScan devtools to sign the tx hash of the payment transaction, save it to
                  use on the next step to request the start of the subscription.
                </p>
              </div>
            </div>
            <div className="subscriptions-step">
              <div className="subscriptions-step-number">3</div>
              <div className="subscriptions-step-content">
                <h4>Submit Github Pull Request or Issue</h4>
                <p>
                  Create a pull request or issue to the explorer-metadata repository with your
                  project information and payment transaction hash.
                </p>
              </div>
            </div>
            <div className="subscriptions-step">
              <div className="subscriptions-step-number">4</div>
              <div className="subscriptions-step-content">
                <h4>Get Verified</h4>
                <p>
                  Once your payment is confirmed and your pull request or issue is reviewed, your
                  subscription benefits will be activated.
                </p>
              </div>
            </div>
          </div>

          {/* Collapsible Help Images */}
          <div className="subscriptions-help-images">
            {/* biome-ignore lint/a11y/useButtonType: toggle button */}
            <button
              className="subscriptions-help-toggle"
              onClick={() => setShowHelpImages(!showHelpImages)}
            >
              {showHelpImages ? "Hide" : "Show"} Visual Guide
              <span className="subscriptions-help-toggle-icon">{showHelpImages ? "▲" : "▼"}</span>
            </button>
            {showHelpImages && (
              <div className="subscriptions-help-images-content">
                <div className="subscriptions-help-image-wrapper">
                  <h4>
                    Step 1: Make Payment on{" "}
                    <a
                      href={`/1/address/${OPENSCAN_PAYMENT_ADDRESS}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      OpenScanPayment Contract
                    </a>
                  </h4>
                  <img
                    src={paymentHelp1}
                    alt="Payment help step 1 - How to make payment to the contract"
                    className="subscriptions-help-image"
                  />
                </div>
                <div className="subscriptions-help-image-wrapper">
                  <h4>
                    Step 2: Sign Transaction Hash on{" "}
                    <a href="/devtools" target="_blank" rel="noopener noreferrer">
                      Devtools
                    </a>
                  </h4>
                  <img
                    src={paymentHelp2}
                    alt="Payment help step 2 - How to sign the transaction hash"
                    className="subscriptions-help-image"
                  />
                </div>
                <div className="subscriptions-help-image-wrapper">
                  <h4>
                    Step 3: Submit Github Issue on{" "}
                    <a
                      href="https://github.com/openscan-explorer/explorer-metadata"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      explorer-metadata
                    </a>
                  </h4>
                  <img
                    src={paymentHelp3}
                    alt="Payment help step 3 - How to submit an issue request"
                    className="subscriptions-help-image"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="subscriptions-cta-buttons">
            <a href={`/1/address/${OPENSCAN_PAYMENT_ADDRESS}`} className="button-primary-inline">
              View Payment Contract
            </a>
            <a
              href="https://github.com/openscan-explorer/explorer-metadata"
              target="_blank"
              rel="noopener noreferrer"
              className="button-secondary-inline"
            >
              View Metadata Repository
            </a>
          </div>
        </div>

        {/* Footer Note */}
        <div className="text-center license-footer">
          <p>
            All revenue is reinvested solely for the platform's continuous development, growth, and
            infrastructural improvement.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Subscriptions;
