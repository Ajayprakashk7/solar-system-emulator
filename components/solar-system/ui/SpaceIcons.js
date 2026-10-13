const Icon = ({ children, className = 'h-4 w-4', viewBox = '0 0 24 24' }) => (
  <svg
    aria-hidden="true"
    viewBox={viewBox}
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {children}
  </svg>
);

export const ArrowLeftIcon = ({ className }) => (
  <Icon className={className}>
    <path d="M19 12H5" />
    <path d="m11 18-6-6 6-6" />
  </Icon>
);

export const OverviewIcon = ({ className }) => (
  <Icon className={className}>
    <circle cx="12" cy="12" r="7.25" />
    <circle cx="12" cy="12" r="1.5" />
    <path d="M12 2.5v2.25M12 19.25v2.25M2.5 12h2.25M19.25 12h2.25" />
  </Icon>
);

export const SpeedIcon = ({ className }) => (
  <Icon className={className}>
    <path d="M5.3 18.2a8 8 0 1 1 13.4 0" />
    <path d="M12 12 16.2 8.8" />
    <circle cx="12" cy="12" r="1.25" />
  </Icon>
);

export const ShareIcon = ({ className }) => (
  <Icon className={className}>
    <circle cx="18" cy="5" r="2.25" />
    <circle cx="6" cy="12" r="2.25" />
    <circle cx="18" cy="19" r="2.25" />
    <path d="m8 10.9 7.9-4.7M8 13.1l7.9 4.7" />
  </Icon>
);

export const ChevronIcon = ({ className }) => (
  <Icon className={className}>
    <path d="m7 10 5 5 5-5" />
  </Icon>
);

export const CloseIcon = ({ className }) => (
  <Icon className={className}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Icon>
);
