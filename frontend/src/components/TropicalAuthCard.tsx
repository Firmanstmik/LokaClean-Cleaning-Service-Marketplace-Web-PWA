import { ReactNode } from "react";
import { Link } from "react-router-dom";
import "../styles/tropicalAuth.css";

type TropicalAuthCardProps = {
  title: string;
  subtitle?: string;
  mascotSrc?: string;
  children?: ReactNode;
  primaryHref?: string;
  primaryText?: string;
  secondaryHref?: string;
  secondaryText?: string;
};

export function TropicalAuthCard({
  title,
  subtitle,
  mascotSrc = "/img/maskot1.png",
  children,
  primaryHref,
  primaryText,
  secondaryHref,
  secondaryText
}: TropicalAuthCardProps) {
  return (
    <div className="tropical-bg flex items-center justify-center px-[5vw] sm:px-6 py-6">
      <div className="w-full max-w-[430px] relative tropical-up">
        <div className="lux-card p-6 sm:p-7">
          <div className="flex flex-col items-center text-center">
            {/* Mascot overlap */}
            <div className="mascot-wrap">
              <div className="mascot-glow" />
              <img
                src={mascotSrc}
                alt="LokaClean Mascot"
                width={110}
                height={110}
                className="mascot-float"
                loading="lazy"
                style={{ maxWidth: 110 }}
              />
            </div>

            {/* Wave divider (subtle) */}
            <div className="wave-divider mt-1.5" />

            <h1 className="lux-heading text-[20px] sm:text-[22px] mt-3">{title}</h1>
            {subtitle && (
              <p className="lux-subtext text-[13px] sm:text-[14px] leading-relaxed mt-1.5">
                {subtitle}
              </p>
            )}

            {/* Custom content (e.g., login form) */}
            {children && <div className="mt-12 w-full">{children}</div>}

            {/* Default actions (optional) */}
            {(primaryHref || secondaryHref) && !children && (
              <div className="mt-12 w-full flex flex-col sm:flex-row gap-10 sm:gap-2">
                {primaryHref && primaryText && (
                  <Link to={primaryHref} className="btn-primary-lux text-center">
                    {primaryText}
                  </Link>
                )}
                {secondaryHref && secondaryText && (
                  <Link to={secondaryHref} className="btn-secondary-lux text-center">
                    {secondaryText}
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
