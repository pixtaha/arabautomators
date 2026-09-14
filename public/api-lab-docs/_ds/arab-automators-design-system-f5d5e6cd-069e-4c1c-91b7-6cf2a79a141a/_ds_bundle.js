/* @ds-bundle: {"format":4,"namespace":"ArabAutomatorsDesignSystem_f5d5e6","components":[{"name":"Avatar","sourcePath":"components/core/Avatar.jsx"},{"name":"Badge","sourcePath":"components/core/Badge.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Card","sourcePath":"components/core/Card.jsx"},{"name":"CardHeader","sourcePath":"components/core/Card.jsx"},{"name":"Icon","sourcePath":"components/core/Icon.jsx"},{"name":"IconButton","sourcePath":"components/core/IconButton.jsx"},{"name":"Progress","sourcePath":"components/core/Progress.jsx"},{"name":"StatCard","sourcePath":"components/core/StatCard.jsx"},{"name":"Tag","sourcePath":"components/core/Tag.jsx"},{"name":"BarChart","sourcePath":"components/data/BarChart.jsx"},{"name":"DataTable","sourcePath":"components/data/DataTable.jsx"},{"name":"GoalRow","sourcePath":"components/data/GoalRow.jsx"},{"name":"ListRow","sourcePath":"components/data/ListRow.jsx"},{"name":"EmptyState","sourcePath":"components/feedback/EmptyState.jsx"},{"name":"Modal","sourcePath":"components/feedback/Modal.jsx"},{"name":"Notice","sourcePath":"components/feedback/Notice.jsx"},{"name":"Skeleton","sourcePath":"components/feedback/Skeleton.jsx"},{"name":"Toast","sourcePath":"components/feedback/Toast.jsx"},{"name":"Tooltip","sourcePath":"components/feedback/Tooltip.jsx"},{"name":"Checkbox","sourcePath":"components/forms/Checkbox.jsx"},{"name":"Field","sourcePath":"components/forms/Field.jsx"},{"name":"Input","sourcePath":"components/forms/Input.jsx"},{"name":"RadioGroup","sourcePath":"components/forms/RadioGroup.jsx"},{"name":"Select","sourcePath":"components/forms/Select.jsx"},{"name":"Slider","sourcePath":"components/forms/Slider.jsx"},{"name":"Switch","sourcePath":"components/forms/Switch.jsx"},{"name":"Textarea","sourcePath":"components/forms/Textarea.jsx"},{"name":"Breadcrumb","sourcePath":"components/navigation/Breadcrumb.jsx"},{"name":"Sidebar","sourcePath":"components/navigation/Sidebar.jsx"},{"name":"Tabs","sourcePath":"components/navigation/Tabs.jsx"},{"name":"TopBar","sourcePath":"components/navigation/TopBar.jsx"},{"name":"Wordmark","sourcePath":"components/navigation/Wordmark.jsx"},{"name":"DotField","sourcePath":"components/surfaces/DotField.jsx"},{"name":"SectionHeading","sourcePath":"components/surfaces/SectionHeading.jsx"}],"sourceHashes":{"components/core/Avatar.jsx":"d71c3794a128","components/core/Badge.jsx":"81c8c374f33f","components/core/Button.jsx":"95a0a1c3e874","components/core/Card.jsx":"c6f3b08855c1","components/core/Icon.jsx":"b5bf0da03fbd","components/core/IconButton.jsx":"b41b1e350852","components/core/Progress.jsx":"c04dc83e9949","components/core/StatCard.jsx":"e467fe0e9016","components/core/Tag.jsx":"2cd47057b0bd","components/data/BarChart.jsx":"62573287f77e","components/data/DataTable.jsx":"153e4cb89ce6","components/data/GoalRow.jsx":"04b705b4f45a","components/data/ListRow.jsx":"69cf2662a9f8","components/feedback/EmptyState.jsx":"ad6bbc81c258","components/feedback/Modal.jsx":"3fe50277d4e5","components/feedback/Notice.jsx":"37e666e198ff","components/feedback/Skeleton.jsx":"2b09cb3cf55b","components/feedback/Toast.jsx":"f37a9d3a1c11","components/feedback/Tooltip.jsx":"2a319f5bbc45","components/forms/Checkbox.jsx":"468ff4ba12df","components/forms/Field.jsx":"fdbab5d8fe11","components/forms/Input.jsx":"6e22acfa9348","components/forms/RadioGroup.jsx":"bd37db370116","components/forms/Select.jsx":"9a056bbd6fb7","components/forms/Slider.jsx":"e580e7782429","components/forms/Switch.jsx":"276417a92520","components/forms/Textarea.jsx":"f418579a945a","components/navigation/Breadcrumb.jsx":"e6a79f13391a","components/navigation/Sidebar.jsx":"fd5d340769bc","components/navigation/Tabs.jsx":"f352ad96d0d2","components/navigation/TopBar.jsx":"15f8c68b9f68","components/navigation/Wordmark.jsx":"324c27899927","components/surfaces/DotField.jsx":"b7c3b9d8f434","components/surfaces/SectionHeading.jsx":"84321ac771b4","slides/Slides.jsx":"a4c1b2ac2bfb","ui_kits/community_site/ApplyPage.jsx":"2d86c774564a","ui_kits/community_site/CommunityPage.jsx":"e6b330510622","ui_kits/community_site/CurriculumPage.jsx":"38de99b18faf","ui_kits/community_site/HomePage.jsx":"bc012afc89f8","ui_kits/community_site/SiteChrome.jsx":"b0e8adfbf11a","ui_kits/dashboard/AppShell.jsx":"585157a93c4e","ui_kits/dashboard/LessonScreen.jsx":"ce83fa2cb98f","ui_kits/dashboard/LibraryScreen.jsx":"226734970594","ui_kits/dashboard/MembersScreen.jsx":"04525cab9c2d","ui_kits/dashboard/OverviewScreen.jsx":"38dff3486d85","ui_kits/dashboard/WorkflowsScreen.jsx":"480d1beeb780"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.ArabAutomatorsDesignSystem_f5d5e6 = window.ArabAutomatorsDesignSystem_f5d5e6 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/core/Avatar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const SIZES = {
  xs: 22,
  sm: 28,
  md: 36,
  lg: 48,
  xl: 64
};
function Avatar({
  name = '',
  src,
  size = 'md',
  tone = 'brand',
  square = false,
  style,
  ...rest
}) {
  const d = SIZES[size] || SIZES.md;
  const initials = name.trim().split(/\s+/).slice(0, 2).map(w => w[0] || '').join('').toUpperCase();
  const skin = {
    brand: {
      bg: 'var(--surface-brand-soft)',
      fg: 'var(--aa-green-800)'
    },
    ink: {
      bg: 'var(--surface-ink)',
      fg: 'var(--text-inverse)'
    },
    neutral: {
      bg: 'var(--surface-sunken)',
      fg: 'var(--text-body)'
    },
    accent: {
      bg: 'var(--surface-accent-soft)',
      fg: 'var(--aa-amber-700)'
    }
  }[tone] || {};
  return /*#__PURE__*/React.createElement("span", _extends({
    title: name,
    style: {
      width: d,
      height: d,
      flex: '0 0 auto',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: square ? 'var(--radius-md)' : 'var(--radius-pill)',
      overflow: 'hidden',
      background: skin.bg,
      color: skin.fg,
      font: `var(--fw-bold) ${Math.round(d * 0.36)}px/1 var(--font-display)`,
      letterSpacing: 'var(--tr-tight)',
      border: 'var(--bw-hairline) solid rgba(0,0,0,.06)',
      ...style
    }
  }, rest), src ? /*#__PURE__*/React.createElement("img", {
    src: src,
    alt: name,
    style: {
      width: '100%',
      height: '100%',
      objectFit: 'cover'
    }
  }) : initials);
}
Object.assign(__ds_scope, { Avatar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Avatar.jsx", error: String((e && e.message) || e) }); }

// components/core/Badge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const TONES = {
  neutral: {
    bg: 'var(--surface-sunken)',
    fg: 'var(--text-body)',
    bd: 'transparent',
    dot: 'var(--status-idle)'
  },
  brand: {
    bg: 'var(--surface-brand-soft)',
    fg: 'var(--aa-green-800)',
    bd: 'transparent',
    dot: 'var(--surface-brand)'
  },
  accent: {
    bg: 'var(--surface-accent-soft)',
    fg: 'var(--aa-amber-700)',
    bd: 'transparent',
    dot: 'var(--surface-accent)'
  },
  danger: {
    bg: 'var(--surface-danger-soft)',
    fg: 'var(--aa-red-700)',
    bd: 'transparent',
    dot: 'var(--status-danger)'
  },
  ink: {
    bg: 'var(--surface-ink)',
    fg: 'var(--text-inverse)',
    bd: 'transparent',
    dot: 'var(--aa-neutral-500)'
  },
  outline: {
    bg: 'transparent',
    fg: 'var(--text-body)',
    bd: 'var(--border-hairline-strong)',
    dot: 'var(--status-idle)'
  }
};
function Badge({
  children,
  tone = 'neutral',
  dot = false,
  size = 'md',
  style,
  ...rest
}) {
  const t = TONES[tone] || TONES.neutral;
  const sm = size === 'sm';
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 'var(--space-3)',
      height: sm ? 20 : 24,
      padding: sm ? '0 var(--space-4)' : '0 var(--space-5)',
      borderRadius: 'var(--radius-pill)',
      background: t.bg,
      color: t.fg,
      border: `var(--bw-hairline) solid ${t.bd}`,
      font: `var(--fw-semibold) ${sm ? 'var(--fs-3xs)' : 'var(--fs-2xs)'}/1 var(--font-body)`,
      whiteSpace: 'nowrap',
      ...style
    }
  }, rest), dot && /*#__PURE__*/React.createElement("span", {
    style: {
      width: 6,
      height: 6,
      borderRadius: '50%',
      background: t.dot,
      flex: '0 0 auto'
    }
  }), children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Badge.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const SIZES = {
  sm: {
    h: 32,
    px: 'var(--space-6)',
    fs: 'var(--fs-xs)',
    gap: 'var(--space-3)'
  },
  md: {
    h: 40,
    px: 'var(--space-9)',
    fs: 'var(--fs-sm)',
    gap: 'var(--space-4)'
  },
  lg: {
    h: 48,
    px: 'var(--space-11)',
    fs: 'var(--fs-md)',
    gap: 'var(--space-5)'
  }
};
const VARIANTS = {
  primary: {
    bg: 'var(--surface-brand)',
    fg: 'var(--text-inverse)',
    bd: 'var(--surface-brand)',
    hoverBg: 'var(--surface-brand-hover)',
    hoverBd: 'var(--surface-brand-hover)'
  },
  secondary: {
    bg: 'var(--surface-card)',
    fg: 'var(--text-strong)',
    bd: 'var(--border-hairline-strong)',
    hoverBg: 'var(--surface-hover)',
    hoverBd: 'var(--aa-neutral-500)'
  },
  ink: {
    bg: 'var(--surface-ink)',
    fg: 'var(--text-inverse)',
    bd: 'var(--surface-ink)',
    hoverBg: 'var(--aa-neutral-800)',
    hoverBd: 'var(--aa-neutral-800)'
  },
  accent: {
    bg: 'var(--surface-accent)',
    fg: 'var(--aa-black)',
    bd: 'var(--surface-accent)',
    hoverBg: 'var(--aa-amber-500)',
    hoverBd: 'var(--aa-amber-500)'
  },
  ghost: {
    bg: 'transparent',
    fg: 'var(--text-body)',
    bd: 'transparent',
    hoverBg: 'var(--surface-sunken)',
    hoverBd: 'transparent'
  },
  danger: {
    bg: 'var(--status-danger)',
    fg: 'var(--text-inverse)',
    bd: 'var(--status-danger)',
    hoverBg: 'var(--aa-red-700)',
    hoverBd: 'var(--aa-red-700)'
  }
};
function Button({
  children,
  variant = 'primary',
  size = 'md',
  pill = false,
  block = false,
  disabled = false,
  loading = false,
  iconStart,
  iconEnd,
  type = 'button',
  onClick,
  style,
  className = '',
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  const [down, setDown] = React.useState(false);
  const s = SIZES[size] || SIZES.md;
  const v = VARIANTS[variant] || VARIANTS.primary;
  const off = disabled || loading;
  return /*#__PURE__*/React.createElement("button", _extends({
    type: type,
    disabled: off,
    onClick: onClick,
    className: className,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => {
      setHover(false);
      setDown(false);
    },
    onMouseDown: () => setDown(true),
    onMouseUp: () => setDown(false),
    style: {
      display: block ? 'flex' : 'inline-flex',
      width: block ? '100%' : 'auto',
      alignItems: 'center',
      justifyContent: 'center',
      gap: s.gap,
      height: s.h,
      padding: `0 ${s.px}`,
      border: `var(--bw-hairline) solid ${off ? 'transparent' : hover ? v.hoverBd : v.bd}`,
      borderRadius: pill ? 'var(--radius-pill)' : 'var(--radius-control)',
      background: off ? 'var(--aa-neutral-200)' : hover ? v.hoverBg : v.bg,
      color: off ? 'var(--text-faint)' : v.fg,
      font: `var(--fw-semibold) ${s.fs}/1 var(--font-body)`,
      letterSpacing: 'var(--tr-tight)',
      cursor: off ? 'not-allowed' : 'pointer',
      whiteSpace: 'nowrap',
      transform: down && !off ? 'var(--press-scale)' : 'none',
      transition: 'var(--transition-control)',
      ...style
    }
  }, rest), loading ? /*#__PURE__*/React.createElement(Spinner, null) : iconStart, children, iconEnd);
}
function Spinner() {
  return /*#__PURE__*/React.createElement("span", {
    style: {
      width: 14,
      height: 14,
      borderRadius: '50%',
      flex: '0 0 auto',
      border: '2px solid currentColor',
      borderTopColor: 'transparent',
      animation: 'aa-spin var(--dur-slower) var(--ease-linear) infinite',
      opacity: .7
    }
  });
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/Card.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Card({
  children,
  padding = 'md',
  dots = false,
  stripe,
  interactive = false,
  bordered = true,
  elevation = 'sm',
  as: Tag = 'div',
  style,
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  const pad = {
    none: 0,
    sm: 'var(--space-7)',
    md: 'var(--pad-card)',
    lg: 'var(--pad-card-lg)'
  }[padding];
  const shadow = {
    none: 'var(--shadow-none)',
    xs: 'var(--shadow-xs)',
    sm: 'var(--shadow-sm)',
    md: 'var(--shadow-md)',
    lg: 'var(--shadow-lg)'
  }[elevation];
  const stripeColor = stripe && ({
    brand: 'var(--surface-brand)',
    accent: 'var(--surface-accent)',
    ink: 'var(--surface-ink)',
    danger: 'var(--status-danger)',
    neutral: 'var(--border-hairline-strong)'
  }[stripe] || stripe);
  return /*#__PURE__*/React.createElement(Tag, _extends({
    onMouseEnter: interactive ? () => setHover(true) : undefined,
    onMouseLeave: interactive ? () => setHover(false) : undefined,
    style: {
      position: 'relative',
      overflow: 'hidden',
      padding: pad,
      background: 'var(--surface-card)',
      backgroundImage: dots ? 'var(--bg-dots-soft)' : 'none',
      border: bordered ? 'var(--border-card)' : 'none',
      borderRadius: 'var(--radius-card)',
      boxShadow: interactive && hover ? 'var(--shadow-md)' : shadow,
      transform: interactive && hover ? 'var(--lift-hover)' : 'none',
      transition: 'var(--transition-surface)',
      cursor: interactive ? 'pointer' : 'default',
      ...style
    }
  }, rest), stripeColor && /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      inset: '0 auto 0 0',
      width: 'var(--stripe-w)',
      background: stripeColor
    }
  }), children);
}
function CardHeader({
  title,
  subtitle,
  action,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: 'var(--space-6)',
      marginBottom: 'var(--space-9)',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--type-heading)',
      color: 'var(--text-strong)',
      letterSpacing: 'var(--tr-tight)'
    }
  }, title), subtitle && /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--type-small)',
      color: 'var(--text-muted)',
      marginTop: 'var(--space-2)'
    }
  }, subtitle)), action);
}
Object.assign(__ds_scope, { Card, CardHeader });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Card.jsx", error: String((e && e.message) || e) }); }

// components/core/Icon.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const pascal = n => n.split(/[-_ ]/).filter(Boolean).map(s => s[0].toUpperCase() + s.slice(1)).join('');

/**
 * Thin wrapper over the Lucide UMD build (window.lucide), which must be loaded
 * from CDN by the host page. Renders an inline SVG at the brand's 2px stroke.
 */
function Icon({
  name,
  size = 18,
  strokeWidth = 2,
  color = 'currentColor',
  style,
  ...rest
}) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    const host = ref.current;
    if (!host) return;
    const L = typeof window !== 'undefined' ? window.lucide : null;
    const set = L && (L.icons || L);
    const node = set && (set[pascal(name)] || set[name]);
    if (!node) {
      host.innerHTML = '';
      return;
    }
    const children = Array.isArray(node) ? Array.isArray(node[0]) ? node : node[2] : null;
    if (!children) {
      host.innerHTML = '';
      return;
    }
    const attrs = t => Object.entries(t[1] || {}).map(([k, v]) => `${k}="${v}"`).join(' ');
    host.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" ' + `stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" ` + `width="${size}" height="${size}" style="display:block">` + children.map(t => `<${t[0]} ${attrs(t)} />`).join('') + '</svg>';
  }, [name, size, strokeWidth]);
  return /*#__PURE__*/React.createElement("span", _extends({
    ref: ref,
    "aria-hidden": "true",
    style: {
      display: 'inline-flex',
      flex: '0 0 auto',
      width: size,
      height: size,
      color,
      ...style
    }
  }, rest));
}
Object.assign(__ds_scope, { Icon });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Icon.jsx", error: String((e && e.message) || e) }); }

// components/core/IconButton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const SIZES = {
  sm: 28,
  md: 34,
  lg: 40
};
function IconButton({
  children,
  label,
  variant = 'ghost',
  size = 'md',
  round = true,
  disabled = false,
  onClick,
  style,
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  const [down, setDown] = React.useState(false);
  const d = SIZES[size] || SIZES.md;
  const skin = {
    ghost: {
      bg: 'transparent',
      bd: 'transparent',
      fg: 'var(--text-muted)',
      hBg: 'var(--surface-sunken)',
      hFg: 'var(--text-strong)'
    },
    outline: {
      bg: 'var(--surface-card)',
      bd: 'var(--border-hairline)',
      fg: 'var(--text-body)',
      hBg: 'var(--surface-hover)',
      hFg: 'var(--text-strong)'
    },
    sunken: {
      bg: 'var(--surface-sunken)',
      bd: 'transparent',
      fg: 'var(--text-body)',
      hBg: 'var(--aa-neutral-200)',
      hFg: 'var(--text-strong)'
    },
    ink: {
      bg: 'var(--surface-ink)',
      bd: 'var(--surface-ink)',
      fg: 'var(--text-inverse)',
      hBg: 'var(--aa-neutral-800)',
      hFg: 'var(--text-inverse)'
    }
  }[variant] || {};
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    "aria-label": label,
    title: label,
    disabled: disabled,
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => {
      setHover(false);
      setDown(false);
    },
    onMouseDown: () => setDown(true),
    onMouseUp: () => setDown(false),
    style: {
      width: d,
      height: d,
      flex: '0 0 auto',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: round ? 'var(--radius-pill)' : 'var(--radius-sm)',
      border: `var(--bw-hairline) solid ${skin.bd}`,
      background: disabled ? 'transparent' : hover ? skin.hBg : skin.bg,
      color: disabled ? 'var(--text-faint)' : hover ? skin.hFg : skin.fg,
      cursor: disabled ? 'not-allowed' : 'pointer',
      transform: down && !disabled ? 'var(--press-scale)' : 'none',
      transition: 'var(--transition-control)',
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { IconButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/IconButton.jsx", error: String((e && e.message) || e) }); }

// components/core/Progress.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Progress({
  value = 0,
  max = 100,
  tone = 'brand',
  size = 'md',
  label,
  hint,
  style,
  ...rest
}) {
  const pct = Math.max(0, Math.min(100, value / max * 100));
  const h = {
    sm: 4,
    md: 6,
    lg: 10
  }[size] || 6;
  const fill = {
    brand: 'var(--surface-brand)',
    accent: 'var(--surface-accent)',
    ink: 'var(--surface-ink)',
    danger: 'var(--status-danger)'
  }[tone] || tone;
  return /*#__PURE__*/React.createElement("div", _extends({
    style: style
  }, rest), (label || hint) && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      gap: 'var(--space-6)',
      marginBottom: 'var(--space-4)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--type-label)',
      color: 'var(--text-body)'
    }
  }, label), /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--type-mono)',
      color: 'var(--text-muted)'
    }
  }, hint)), /*#__PURE__*/React.createElement("div", {
    style: {
      height: h,
      borderRadius: 'var(--radius-pill)',
      background: 'var(--aa-neutral-200)',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: pct + '%',
      height: '100%',
      borderRadius: 'var(--radius-pill)',
      background: fill,
      transition: `width var(--dur-slow) var(--ease-smooth)`
    }
  })));
}
Object.assign(__ds_scope, { Progress });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Progress.jsx", error: String((e && e.message) || e) }); }

// components/core/StatCard.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function StatCard({
  eyebrow,
  value,
  delta,
  deltaTone = 'brand',
  footnote,
  progress,
  style,
  ...rest
}) {
  const dc = {
    brand: 'var(--text-accent)',
    danger: 'var(--text-danger)',
    neutral: 'var(--text-muted)'
  }[deltaTone];
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      padding: 'var(--space-8)',
      background: 'var(--surface-sunken)',
      borderRadius: 'var(--radius-card-inner)',
      ...style
    }
  }, rest), eyebrow && /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--type-eyebrow)',
      letterSpacing: 'var(--tr-widest)',
      textTransform: 'uppercase',
      color: 'var(--text-muted)'
    }
  }, eyebrow), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'baseline',
      gap: 'var(--space-5)',
      marginTop: 'var(--space-4)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--type-metric)',
      color: 'var(--text-strong)',
      letterSpacing: 'var(--tr-tightest)'
    }
  }, value), delta && /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--fw-semibold) var(--fs-xs)/1 var(--font-mono)',
      color: dc
    }
  }, delta)), progress != null && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 'var(--space-7)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: 6,
      borderRadius: 'var(--radius-pill)',
      background: 'var(--aa-neutral-200)',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: Math.max(0, Math.min(100, progress)) + '%',
      height: '100%',
      background: 'var(--surface-brand)',
      borderRadius: 'var(--radius-pill)',
      transition: 'width var(--dur-slow) var(--ease-smooth)'
    }
  }))), footnote && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      gap: 'var(--space-6)',
      marginTop: 'var(--space-5)',
      font: 'var(--type-small)',
      color: 'var(--text-muted)'
    }
  }, footnote));
}
Object.assign(__ds_scope, { StatCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/StatCard.jsx", error: String((e && e.message) || e) }); }

// components/core/Tag.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Tag({
  children,
  onRemove,
  active = false,
  onClick,
  style,
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  const clickable = !!onClick;
  return /*#__PURE__*/React.createElement("span", _extends({
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 'var(--space-4)',
      height: 28,
      padding: '0 var(--space-5)',
      borderRadius: 'var(--radius-sm)',
      background: active ? 'var(--surface-ink)' : hover && clickable ? 'var(--surface-hover)' : 'var(--surface-card)',
      color: active ? 'var(--text-inverse)' : 'var(--text-body)',
      border: `var(--bw-hairline) solid ${active ? 'var(--surface-ink)' : 'var(--border-hairline)'}`,
      font: 'var(--fw-medium) var(--fs-xs)/1 var(--font-mono)',
      cursor: clickable ? 'pointer' : 'default',
      transition: 'var(--transition-control)',
      ...style
    }
  }, rest), children, onRemove && /*#__PURE__*/React.createElement("span", {
    role: "button",
    "aria-label": "Remove",
    onClick: e => {
      e.stopPropagation();
      onRemove();
    },
    style: {
      display: 'inline-flex',
      opacity: .5,
      cursor: 'pointer',
      fontSize: 14,
      lineHeight: 1
    }
  }, "\xD7"));
}
Object.assign(__ds_scope, { Tag });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Tag.jsx", error: String((e && e.message) || e) }); }

// components/data/BarChart.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function BarChart({
  data = [],
  height = 160,
  tone = 'neutral',
  valueFormat,
  style,
  ...rest
}) {
  const max = Math.max(...data.map(d => d.value), 1);
  const fill = {
    neutral: 'var(--aa-neutral-600)',
    brand: 'var(--surface-brand)',
    ink: 'var(--surface-ink)',
    accent: 'var(--surface-accent)'
  }[tone] || tone;
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-end',
      gap: 'var(--space-6)',
      height
    }
  }, data.map((d, i) => /*#__PURE__*/React.createElement(Bar, {
    key: d.label,
    d: d,
    pct: d.value / max * 100,
    fill: fill,
    i: i,
    valueFormat: valueFormat
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 'var(--space-6)',
      marginTop: 'var(--space-6)'
    }
  }, data.map(d => /*#__PURE__*/React.createElement("div", {
    key: d.label,
    style: {
      flex: 1,
      textAlign: 'center',
      font: 'var(--type-small)',
      color: 'var(--text-muted)'
    }
  }, d.label))));
}
function Bar({
  d,
  pct,
  fill,
  i,
  valueFormat
}) {
  const [hover, setHover] = React.useState(false);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      height: '100%',
      display: 'flex',
      alignItems: 'flex-end',
      position: 'relative'
    },
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false)
  }, hover && valueFormat && /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      bottom: 'calc(' + pct + '% + 8px)',
      left: '50%',
      transform: 'translateX(-50%)',
      padding: '3px 6px',
      borderRadius: 'var(--radius-xs)',
      background: 'var(--surface-ink)',
      color: 'var(--text-inverse)',
      font: 'var(--type-mono)',
      whiteSpace: 'nowrap',
      zIndex: 2
    }
  }, valueFormat(d.value)), /*#__PURE__*/React.createElement("div", {
    style: {
      width: '100%',
      height: pct + '%',
      minHeight: 3,
      background: hover ? 'var(--surface-ink)' : fill,
      borderRadius: 'var(--radius-xs) var(--radius-xs) 0 0',
      animation: `aa-bar-grow var(--dur-slow) var(--ease-smooth) both`,
      animationDelay: `calc(${i} * var(--stagger-step))`,
      transformOrigin: 'bottom',
      transition: `background-color var(--dur-fast) var(--ease-smooth)`
    }
  }));
}
Object.assign(__ds_scope, { BarChart });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/BarChart.jsx", error: String((e && e.message) || e) }); }

// components/data/DataTable.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function DataTable({
  columns = [],
  rows = [],
  dense = false,
  onRowClick,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      width: '100%',
      overflowX: 'auto',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("table", {
    style: {
      width: '100%',
      borderCollapse: 'collapse'
    }
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, columns.map(c => /*#__PURE__*/React.createElement("th", {
    key: c.key,
    style: {
      textAlign: c.align || 'start',
      padding: dense ? 'var(--space-4) var(--space-6)' : 'var(--space-6) var(--space-7)',
      borderBottom: 'var(--rule-thick)',
      whiteSpace: 'nowrap',
      font: 'var(--type-eyebrow)',
      letterSpacing: 'var(--tr-widest)',
      textTransform: 'uppercase',
      color: 'var(--text-muted)',
      width: c.width
    }
  }, c.label)))), /*#__PURE__*/React.createElement("tbody", null, rows.map((r, i) => /*#__PURE__*/React.createElement(Row, {
    key: r.id ?? i,
    row: r,
    columns: columns,
    dense: dense,
    onRowClick: onRowClick
  })))));
}
function Row({
  row,
  columns,
  dense,
  onRowClick
}) {
  const [hover, setHover] = React.useState(false);
  return /*#__PURE__*/React.createElement("tr", {
    onClick: onRowClick ? () => onRowClick(row) : undefined,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      background: hover && onRowClick ? 'var(--surface-hover)' : 'transparent',
      cursor: onRowClick ? 'pointer' : 'default',
      transition: `background-color var(--dur-fast) var(--ease-smooth)`
    }
  }, columns.map(c => /*#__PURE__*/React.createElement("td", {
    key: c.key,
    style: {
      textAlign: c.align || 'start',
      padding: dense ? 'var(--space-5) var(--space-6)' : 'var(--space-7)',
      borderBottom: 'var(--rule-hairline)',
      font: c.mono ? 'var(--type-mono)' : 'var(--type-small)',
      color: c.strong ? 'var(--text-strong)' : 'var(--text-body)',
      fontWeight: c.strong ? 'var(--fw-semibold)' : undefined
    }
  }, c.render ? c.render(row) : row[c.key])));
}
Object.assign(__ds_scope, { DataTable });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/DataTable.jsx", error: String((e && e.message) || e) }); }

// components/data/GoalRow.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function GoalRow({
  label,
  current,
  target,
  pct,
  note,
  tone = 'brand',
  style,
  ...rest
}) {
  const p = pct != null ? pct : Math.round(current / target * 100);
  const fill = {
    brand: 'var(--surface-brand)',
    accent: 'var(--surface-accent)',
    ink: 'var(--surface-ink)'
  }[tone] || tone;
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      padding: 'var(--space-8)',
      background: 'var(--surface-sunken)',
      borderRadius: 'var(--radius-card-inner)',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--type-eyebrow)',
      letterSpacing: 'var(--tr-widest)',
      textTransform: 'uppercase',
      color: 'var(--text-muted)'
    }
  }, label), /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--type-metric)',
      color: 'var(--text-strong)',
      letterSpacing: 'var(--tr-tightest)',
      marginTop: 'var(--space-3)'
    }
  }, target), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 6,
      borderRadius: 'var(--radius-pill)',
      background: 'var(--aa-neutral-300)',
      overflow: 'hidden',
      marginTop: 'var(--space-8)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: Math.max(0, Math.min(100, p)) + '%',
      height: '100%',
      background: fill,
      borderRadius: 'var(--radius-pill)',
      transition: 'width var(--dur-slow) var(--ease-smooth)'
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      gap: 'var(--space-6)',
      marginTop: 'var(--space-5)',
      font: 'var(--type-small)',
      color: 'var(--text-muted)'
    }
  }, /*#__PURE__*/React.createElement("span", null, p, "% achieved"), /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--type-mono)'
    }
  }, note ?? current)));
}
Object.assign(__ds_scope, { GoalRow });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/GoalRow.jsx", error: String((e && e.message) || e) }); }

// components/data/ListRow.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function ListRow({
  icon,
  title,
  subtitle,
  meta,
  value,
  valueTone = 'default',
  trailing,
  divider = true,
  onClick,
  style,
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  const vc = {
    default: 'var(--text-strong)',
    positive: 'var(--text-accent)',
    negative: 'var(--text-strong)',
    muted: 'var(--text-muted)'
  }[valueTone];
  return /*#__PURE__*/React.createElement("div", _extends({
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-8)',
      padding: 'var(--space-7) var(--space-2)',
      borderBottom: divider ? 'var(--rule-hairline)' : 'none',
      background: hover && onClick ? 'var(--surface-hover)' : 'transparent',
      cursor: onClick ? 'pointer' : 'default',
      transition: `background-color var(--dur-fast) var(--ease-smooth)`,
      ...style
    }
  }, rest), icon && /*#__PURE__*/React.createElement("span", {
    style: {
      width: 36,
      height: 36,
      flex: '0 0 auto',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 'var(--radius-md)',
      background: 'var(--surface-sunken)',
      color: 'var(--text-body)'
    }
  }, icon), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--fw-semibold) var(--fs-sm)/1.35 var(--font-body)',
      color: 'var(--text-strong)',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    }
  }, title), subtitle && /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--type-small)',
      color: 'var(--text-muted)'
    }
  }, subtitle)), meta && /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--type-small)',
      color: 'var(--text-muted)',
      flex: '0 0 auto',
      whiteSpace: 'nowrap'
    }
  }, meta), value != null && /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--fw-semibold) var(--fs-sm)/1 var(--font-mono)',
      color: vc,
      flex: '0 0 auto',
      whiteSpace: 'nowrap'
    }
  }, value), trailing);
}
Object.assign(__ds_scope, { ListRow });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/ListRow.jsx", error: String((e && e.message) || e) }); }

// components/feedback/EmptyState.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function EmptyState({
  icon,
  title,
  children,
  action,
  dots = true,
  compact = false,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center',
      padding: compact ? 'var(--space-12) var(--space-9)' : 'var(--space-14) var(--space-10)',
      borderRadius: 'var(--radius-card)',
      background: 'var(--surface-card)',
      backgroundImage: dots ? 'var(--bg-dots-soft)' : 'none',
      border: 'var(--border-card)',
      ...style
    }
  }, rest), icon && /*#__PURE__*/React.createElement("span", {
    style: {
      width: 48,
      height: 48,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 'var(--radius-pill)',
      background: 'var(--surface-sunken)',
      color: 'var(--text-body)',
      marginBottom: 'var(--space-8)'
    }
  }, icon), /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--type-heading)',
      color: 'var(--text-strong)'
    }
  }, title), children && /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--type-small)',
      color: 'var(--text-muted)',
      marginTop: 'var(--space-4)',
      maxWidth: 320
    }
  }, children), action && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 'var(--space-9)'
    }
  }, action));
}
Object.assign(__ds_scope, { EmptyState });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/EmptyState.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Modal.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Modal({
  open = false,
  onClose,
  title,
  subtitle,
  children,
  footer,
  width = 480,
  style,
  ...rest
}) {
  if (!open) return null;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'fixed',
      inset: 0,
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'var(--space-10)',
      background: 'rgba(12,12,12,.34)',
      backdropFilter: 'blur(3px)',
      animation: 'aa-fade-in var(--dur-base) var(--ease-smooth) both'
    },
    onClick: onClose
  }, /*#__PURE__*/React.createElement("div", _extends({
    role: "dialog",
    "aria-modal": "true",
    onClick: e => e.stopPropagation(),
    style: {
      width: '100%',
      maxWidth: width,
      background: 'var(--surface-card)',
      borderRadius: 'var(--radius-sheet)',
      boxShadow: 'var(--shadow-xl)',
      overflow: 'hidden',
      animation: 'aa-sheet-in var(--dur-slow) var(--ease-entrance) both',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 'var(--pad-card-lg) var(--pad-card-lg) var(--space-9)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: 'var(--space-8)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--type-title)',
      color: 'var(--text-strong)'
    }
  }, title), subtitle && /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--type-small)',
      color: 'var(--text-muted)',
      marginTop: 'var(--space-3)'
    }
  }, subtitle)), onClose && /*#__PURE__*/React.createElement("button", {
    type: "button",
    "aria-label": "Close",
    onClick: onClose,
    style: {
      border: 'none',
      background: 'transparent',
      cursor: 'pointer',
      color: 'var(--text-faint)',
      font: '20px/1 var(--font-body)',
      padding: 2
    }
  }, "\xD7")), children && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 'var(--space-10)'
    }
  }, children)), footer && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: 'var(--space-6)',
      padding: 'var(--space-8) var(--pad-card-lg)',
      background: 'var(--surface-sunken)',
      borderTop: 'var(--rule-hairline)'
    }
  }, footer)));
}
Object.assign(__ds_scope, { Modal });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Modal.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Notice.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const TONES = {
  info: {
    stripe: 'var(--surface-ink)',
    bg: 'var(--surface-card)',
    fg: 'var(--text-strong)'
  },
  success: {
    stripe: 'var(--surface-brand)',
    bg: 'var(--surface-card)',
    fg: 'var(--aa-green-800)'
  },
  warning: {
    stripe: 'var(--surface-accent)',
    bg: 'var(--surface-card)',
    fg: 'var(--aa-amber-700)'
  },
  danger: {
    stripe: 'var(--status-danger)',
    bg: 'var(--surface-card)',
    fg: 'var(--aa-red-700)'
  }
};

/** Supabase-style notification: a heavy status rule down the leading edge of a quiet card. */
function Notice({
  tone = 'info',
  title,
  children,
  icon,
  action,
  onDismiss,
  style,
  ...rest
}) {
  const t = TONES[tone] || TONES.info;
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      position: 'relative',
      display: 'flex',
      alignItems: 'flex-start',
      gap: 'var(--space-7)',
      padding: 'var(--space-7) var(--space-8) var(--space-7) var(--space-9)',
      background: t.bg,
      border: 'var(--border-card)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--shadow-xs)',
      overflow: 'hidden',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      inset: '0 auto 0 0',
      width: 'var(--stripe-w)',
      background: t.stripe
    }
  }), icon && /*#__PURE__*/React.createElement("span", {
    style: {
      color: t.stripe,
      flex: '0 0 auto',
      marginTop: 1
    }
  }, icon), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, title && /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--fw-bold) var(--fs-sm)/1.35 var(--font-body)',
      color: 'var(--text-strong)'
    }
  }, title), children && /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--type-small)',
      color: 'var(--text-muted)',
      marginTop: title ? 2 : 0
    }
  }, children), action && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 'var(--space-6)'
    }
  }, action)), onDismiss && /*#__PURE__*/React.createElement("button", {
    type: "button",
    "aria-label": "Dismiss",
    onClick: onDismiss,
    style: {
      border: 'none',
      background: 'transparent',
      cursor: 'pointer',
      color: 'var(--text-faint)',
      font: '16px/1 var(--font-body)',
      padding: 2,
      flex: '0 0 auto'
    }
  }, "\xD7"));
}
Object.assign(__ds_scope, { Notice });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Notice.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Skeleton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Skeleton({
  width = '100%',
  height = 12,
  radius = 'var(--radius-xs)',
  circle = false,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: 'block',
      width: circle ? height : width,
      height,
      borderRadius: circle ? '50%' : radius,
      background: 'linear-gradient(90deg,var(--aa-neutral-200) 0%,var(--aa-neutral-100) 50%,var(--aa-neutral-200) 100%)',
      backgroundSize: '200% 100%',
      animation: 'aa-shimmer var(--dur-ambient) var(--ease-linear) infinite',
      ...style
    }
  }, rest));
}
Object.assign(__ds_scope, { Skeleton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Skeleton.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Toast.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Toast({
  tone = 'ink',
  title,
  children,
  icon,
  onDismiss,
  style,
  ...rest
}) {
  const skin = {
    ink: {
      bg: 'var(--surface-ink)',
      fg: 'var(--text-inverse)',
      sub: 'var(--text-inverse-muted)',
      accent: 'var(--aa-green-300)'
    },
    brand: {
      bg: 'var(--surface-brand)',
      fg: 'var(--text-inverse)',
      sub: 'rgba(255,255,255,.72)',
      accent: '#fff'
    },
    danger: {
      bg: 'var(--status-danger)',
      fg: 'var(--text-inverse)',
      sub: 'rgba(255,255,255,.75)',
      accent: '#fff'
    }
  }[tone] || {};
  return /*#__PURE__*/React.createElement("div", _extends({
    role: "status",
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: 'var(--space-7)',
      minWidth: 280,
      maxWidth: 400,
      padding: 'var(--space-7) var(--space-8)',
      background: skin.bg,
      color: skin.fg,
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--shadow-lg)',
      animation: `aa-toast-in var(--dur-slow) var(--ease-entrance) both`,
      ...style
    }
  }, rest), icon && /*#__PURE__*/React.createElement("span", {
    style: {
      color: skin.accent,
      flex: '0 0 auto',
      marginTop: 1
    }
  }, icon), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, title && /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--fw-semibold) var(--fs-sm)/1.35 var(--font-body)'
    }
  }, title), children && /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--type-small)',
      color: skin.sub,
      marginTop: title ? 2 : 0
    }
  }, children)), onDismiss && /*#__PURE__*/React.createElement("button", {
    type: "button",
    "aria-label": "Dismiss",
    onClick: onDismiss,
    style: {
      border: 'none',
      background: 'transparent',
      color: skin.sub,
      cursor: 'pointer',
      font: '16px/1 var(--font-body)',
      padding: 2
    }
  }, "\xD7"));
}
Object.assign(__ds_scope, { Toast });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Toast.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Tooltip.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Tooltip({
  label,
  children,
  placement = 'top',
  style,
  ...rest
}) {
  const [open, setOpen] = React.useState(false);
  const pos = {
    top: {
      bottom: '100%',
      left: '50%',
      transform: `translate(-50%,${open ? '-8px' : '-2px'})`
    },
    bottom: {
      top: '100%',
      left: '50%',
      transform: `translate(-50%,${open ? '8px' : '2px'})`
    },
    left: {
      right: '100%',
      top: '50%',
      transform: `translate(${open ? '-8px' : '-2px'},-50%)`
    },
    right: {
      left: '100%',
      top: '50%',
      transform: `translate(${open ? '8px' : '2px'},-50%)`
    }
  }[placement];
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      position: 'relative',
      display: 'inline-flex',
      ...style
    },
    onMouseEnter: () => setOpen(true),
    onMouseLeave: () => setOpen(false),
    onFocus: () => setOpen(true),
    onBlur: () => setOpen(false)
  }, rest), children, /*#__PURE__*/React.createElement("span", {
    role: "tooltip",
    style: {
      position: 'absolute',
      ...pos,
      zIndex: 40,
      pointerEvents: 'none',
      whiteSpace: 'nowrap',
      padding: 'var(--space-3) var(--space-6)',
      borderRadius: 'var(--radius-sm)',
      background: 'var(--surface-ink)',
      color: 'var(--text-inverse)',
      font: 'var(--fw-medium) var(--fs-2xs)/1.3 var(--font-body)',
      opacity: open ? 1 : 0,
      boxShadow: 'var(--shadow-md)',
      transition: `opacity var(--dur-fast) var(--ease-smooth), transform var(--dur-base) var(--ease-smooth)`
    }
  }, label));
}
Object.assign(__ds_scope, { Tooltip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Tooltip.jsx", error: String((e && e.message) || e) }); }

// components/forms/Checkbox.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Checkbox({
  checked = false,
  onChange,
  label,
  description,
  disabled = false,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("label", _extends({
    style: {
      display: 'flex',
      alignItems: description ? 'flex-start' : 'center',
      gap: 'var(--space-6)',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? .5 : 1,
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 18,
      height: 18,
      flex: '0 0 auto',
      marginTop: description ? 2 : 0,
      borderRadius: 'var(--radius-xs)',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: checked ? 'var(--surface-brand)' : 'var(--surface-card)',
      border: `var(--bw-thick) solid ${checked ? 'var(--surface-brand)' : 'var(--border-hairline-strong)'}`,
      transition: 'var(--transition-control)'
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: checked,
    disabled: disabled,
    onChange: e => onChange && onChange(e.target.checked),
    style: {
      position: 'absolute',
      opacity: 0,
      width: 0,
      height: 0
    }
  }), checked && /*#__PURE__*/React.createElement("svg", {
    width: "11",
    height: "11",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "#fff",
    strokeWidth: "3.5",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M20 6 9 17l-5-5"
  }))), (label || description) && /*#__PURE__*/React.createElement("span", {
    style: {
      minWidth: 0
    }
  }, label && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      font: 'var(--fw-medium) var(--fs-sm)/1.4 var(--font-body)',
      color: 'var(--text-strong)'
    }
  }, label), description && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      font: 'var(--type-small)',
      color: 'var(--text-muted)',
      marginTop: 2
    }
  }, description)));
}
Object.assign(__ds_scope, { Checkbox });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Checkbox.jsx", error: String((e && e.message) || e) }); }

// components/forms/Field.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Field({
  label,
  hint,
  error,
  required = false,
  htmlFor,
  children,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-4)',
      ...style
    }
  }, rest), label && /*#__PURE__*/React.createElement("label", {
    htmlFor: htmlFor,
    style: {
      font: 'var(--fw-semibold) var(--fs-sm)/1.3 var(--font-body)',
      color: 'var(--text-strong)'
    }
  }, label, required && /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--status-danger)',
      marginInlineStart: 3
    }
  }, "*")), children, (error || hint) && /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--type-small)',
      color: error ? 'var(--text-danger)' : 'var(--text-muted)'
    }
  }, error || hint));
}
Object.assign(__ds_scope, { Field });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Field.jsx", error: String((e && e.message) || e) }); }

// components/forms/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Input({
  value,
  onChange,
  placeholder,
  type = 'text',
  prefix,
  suffix,
  disabled = false,
  invalid = false,
  size = 'md',
  sunken = false,
  style,
  ...rest
}) {
  const [focus, setFocus] = React.useState(false);
  const h = {
    sm: 34,
    md: 42,
    lg: 48
  }[size] || 42;
  const border = invalid ? 'var(--status-danger)' : focus ? 'var(--border-focus)' : 'var(--border-hairline-strong)';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-5)',
      height: h,
      padding: '0 var(--pad-control)',
      borderRadius: 'var(--radius-control)',
      background: disabled ? 'var(--surface-sunken)' : sunken ? 'var(--surface-sunken)' : 'var(--surface-card)',
      border: `var(--bw-hairline) solid ${sunken && !focus && !invalid ? 'transparent' : border}`,
      boxShadow: focus ? invalid ? 'var(--ring-danger)' : 'var(--ring-focus)' : 'none',
      transition: 'var(--transition-control)',
      ...style
    }
  }, prefix && /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--type-body)',
      color: 'var(--text-muted)',
      flex: '0 0 auto'
    }
  }, prefix), /*#__PURE__*/React.createElement("input", _extends({
    type: type,
    value: value,
    onChange: e => onChange && onChange(e.target.value),
    placeholder: placeholder,
    disabled: disabled,
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    style: {
      flex: 1,
      minWidth: 0,
      border: 'none',
      outline: 'none',
      background: 'transparent',
      font: `var(--fw-regular) ${size === 'sm' ? 'var(--fs-sm)' : 'var(--fs-base)'}/1 var(--font-body)`,
      color: 'var(--text-strong)'
    }
  }, rest)), suffix && /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--type-mono)',
      color: 'var(--text-muted)',
      flex: '0 0 auto'
    }
  }, suffix));
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Input.jsx", error: String((e && e.message) || e) }); }

// components/forms/RadioGroup.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function RadioGroup({
  value,
  onChange,
  options = [],
  name = 'radio',
  direction = 'column',
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    role: "radiogroup",
    style: {
      display: 'flex',
      flexDirection: direction,
      gap: direction === 'row' ? 'var(--space-10)' : 'var(--space-6)',
      ...style
    }
  }, rest), options.map(o => {
    const opt = typeof o === 'string' ? {
      value: o,
      label: o
    } : o;
    const on = value === opt.value;
    return /*#__PURE__*/React.createElement("label", {
      key: opt.value,
      style: {
        display: 'flex',
        alignItems: opt.description ? 'flex-start' : 'center',
        gap: 'var(--space-6)',
        cursor: 'pointer'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 18,
        height: 18,
        flex: '0 0 auto',
        marginTop: opt.description ? 2 : 0,
        borderRadius: '50%',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--surface-card)',
        border: `var(--bw-thick) solid ${on ? 'var(--surface-brand)' : 'var(--border-hairline-strong)'}`,
        transition: 'var(--transition-control)'
      }
    }, /*#__PURE__*/React.createElement("input", {
      type: "radio",
      name: name,
      checked: on,
      onChange: () => onChange && onChange(opt.value),
      style: {
        position: 'absolute',
        opacity: 0,
        width: 0,
        height: 0
      }
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: 'var(--surface-brand)',
        transform: on ? 'scale(1)' : 'scale(0)',
        transition: 'transform var(--dur-fast) var(--ease-smooth)'
      }
    })), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("span", {
      style: {
        display: 'block',
        font: 'var(--fw-medium) var(--fs-sm)/1.4 var(--font-body)',
        color: 'var(--text-strong)'
      }
    }, opt.label), opt.description && /*#__PURE__*/React.createElement("span", {
      style: {
        display: 'block',
        font: 'var(--type-small)',
        color: 'var(--text-muted)',
        marginTop: 2
      }
    }, opt.description)));
  }));
}
Object.assign(__ds_scope, { RadioGroup });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/RadioGroup.jsx", error: String((e && e.message) || e) }); }

// components/forms/Select.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Select({
  value,
  onChange,
  options = [],
  placeholder = 'Select…',
  disabled = false,
  size = 'md',
  style,
  ...rest
}) {
  const [focus, setFocus] = React.useState(false);
  const h = {
    sm: 34,
    md: 42,
    lg: 48
  }[size] || 42;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      ...style
    }
  }, /*#__PURE__*/React.createElement("select", _extends({
    value: value ?? '',
    disabled: disabled,
    onChange: e => onChange && onChange(e.target.value),
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    style: {
      width: '100%',
      height: h,
      padding: '0 var(--space-11) 0 var(--pad-control)',
      appearance: 'none',
      WebkitAppearance: 'none',
      outline: 'none',
      borderRadius: 'var(--radius-control)',
      background: disabled ? 'var(--surface-sunken)' : 'var(--surface-card)',
      border: `var(--bw-hairline) solid ${focus ? 'var(--border-focus)' : 'var(--border-hairline-strong)'}`,
      boxShadow: focus ? 'var(--ring-focus)' : 'none',
      font: `var(--fw-regular) ${size === 'sm' ? 'var(--fs-sm)' : 'var(--fs-base)'}/1 var(--font-body)`,
      color: value ? 'var(--text-strong)' : 'var(--text-faint)',
      cursor: disabled ? 'not-allowed' : 'pointer',
      transition: 'var(--transition-control)'
    }
  }, rest), !value && /*#__PURE__*/React.createElement("option", {
    value: ""
  }, placeholder), options.map(o => {
    const opt = typeof o === 'string' ? {
      value: o,
      label: o
    } : o;
    return /*#__PURE__*/React.createElement("option", {
      key: opt.value,
      value: opt.value
    }, opt.label);
  })), /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      position: 'absolute',
      top: '50%',
      insetInlineEnd: 'var(--pad-control)',
      transform: 'translateY(-50%)',
      width: 10,
      height: 6,
      pointerEvents: 'none',
      clipPath: 'polygon(0 0,100% 0,50% 100%)',
      background: 'var(--text-muted)'
    }
  }));
}
Object.assign(__ds_scope, { Select });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Select.jsx", error: String((e && e.message) || e) }); }

// components/forms/Slider.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Slider({
  value = 0,
  min = 0,
  max = 100,
  step = 1,
  onChange,
  minLabel,
  maxLabel,
  style,
  ...rest
}) {
  const pct = (value - min) / (max - min) * 100;
  return /*#__PURE__*/React.createElement("div", _extends({
    style: style
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      height: 20,
      display: 'flex',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: '0 0 auto 0',
      top: 8,
      height: 4,
      borderRadius: 'var(--radius-pill)',
      background: 'var(--aa-neutral-300)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 8,
      left: 0,
      width: pct + '%',
      height: 4,
      borderRadius: 'var(--radius-pill)',
      background: 'var(--surface-brand)'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      top: 3,
      left: `calc(${pct}% - 7px)`,
      width: 14,
      height: 14,
      borderRadius: '50%',
      background: '#fff',
      border: 'var(--bw-thick) solid var(--surface-brand)',
      boxShadow: 'var(--shadow-xs)',
      pointerEvents: 'none'
    }
  }), /*#__PURE__*/React.createElement("input", {
    type: "range",
    value: value,
    min: min,
    max: max,
    step: step,
    onChange: e => onChange && onChange(Number(e.target.value)),
    style: {
      position: 'relative',
      width: '100%',
      margin: 0,
      opacity: 0,
      height: 20,
      cursor: 'pointer'
    }
  })), (minLabel || maxLabel) && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      marginTop: 'var(--space-4)',
      font: 'var(--type-mono)',
      color: 'var(--text-muted)'
    }
  }, /*#__PURE__*/React.createElement("span", null, minLabel), /*#__PURE__*/React.createElement("span", null, maxLabel)));
}
Object.assign(__ds_scope, { Slider });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Slider.jsx", error: String((e && e.message) || e) }); }

// components/forms/Switch.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Switch({
  checked = false,
  onChange,
  label,
  size = 'md',
  disabled = false,
  tone = 'brand',
  style,
  ...rest
}) {
  const w = size === 'sm' ? 34 : 42,
    h = size === 'sm' ? 20 : 24,
    k = h - 6;
  const on = {
    brand: 'var(--surface-brand)',
    ink: 'var(--surface-ink)',
    accent: 'var(--surface-accent)'
  }[tone];
  return /*#__PURE__*/React.createElement("label", _extends({
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 'var(--space-6)',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? .5 : 1,
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    style: {
      width: w,
      height: h,
      flex: '0 0 auto',
      borderRadius: 'var(--radius-pill)',
      position: 'relative',
      background: checked ? on : 'var(--aa-neutral-400)',
      transition: `background-color var(--dur-base) var(--ease-smooth)`
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: checked,
    disabled: disabled,
    onChange: e => onChange && onChange(e.target.checked),
    style: {
      position: 'absolute',
      opacity: 0,
      width: 0,
      height: 0
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      top: 3,
      left: 3,
      width: k,
      height: k,
      borderRadius: '50%',
      background: '#fff',
      boxShadow: '0 1px 2px rgba(0,0,0,.25)',
      transform: `translateX(${checked ? w - k - 6 : 0}px)`,
      transition: `transform var(--dur-base) var(--ease-smooth)`
    }
  })), label && /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--fw-medium) var(--fs-sm)/1.4 var(--font-body)',
      color: 'var(--text-strong)'
    }
  }, label));
}
Object.assign(__ds_scope, { Switch });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Switch.jsx", error: String((e && e.message) || e) }); }

// components/forms/Textarea.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Textarea({
  value,
  onChange,
  placeholder,
  rows = 4,
  disabled = false,
  invalid = false,
  sunken = true,
  style,
  ...rest
}) {
  const [focus, setFocus] = React.useState(false);
  const border = invalid ? 'var(--status-danger)' : focus ? 'var(--border-focus)' : sunken ? 'transparent' : 'var(--border-hairline-strong)';
  return /*#__PURE__*/React.createElement("textarea", _extends({
    value: value,
    rows: rows,
    placeholder: placeholder,
    disabled: disabled,
    onChange: e => onChange && onChange(e.target.value),
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    style: {
      width: '100%',
      padding: 'var(--space-6) var(--pad-control)',
      resize: 'vertical',
      borderRadius: 'var(--radius-control)',
      outline: 'none',
      background: sunken ? 'var(--surface-sunken)' : 'var(--surface-card)',
      border: `var(--bw-hairline) solid ${border}`,
      boxShadow: focus ? invalid ? 'var(--ring-danger)' : 'var(--ring-focus)' : 'none',
      font: 'var(--type-body)',
      color: 'var(--text-strong)',
      transition: 'var(--transition-control)',
      ...style
    }
  }, rest));
}
Object.assign(__ds_scope, { Textarea });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Textarea.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Breadcrumb.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Breadcrumb({
  items = [],
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("nav", _extends({
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-4)',
      flexWrap: 'wrap',
      ...style
    }
  }, rest), items.map((it, i) => {
    const item = typeof it === 'string' ? {
      label: it
    } : it;
    const last = i === items.length - 1;
    return /*#__PURE__*/React.createElement(React.Fragment, {
      key: i
    }, item.href && !last ? /*#__PURE__*/React.createElement("a", {
      href: item.href,
      style: {
        font: 'var(--type-small)',
        color: 'var(--text-muted)'
      }
    }, item.label) : /*#__PURE__*/React.createElement("span", {
      style: {
        font: last ? 'var(--fw-semibold) var(--fs-sm)/1.4 var(--font-body)' : 'var(--type-small)',
        color: last ? 'var(--text-strong)' : 'var(--text-muted)'
      }
    }, item.label), !last && /*#__PURE__*/React.createElement("span", {
      "aria-hidden": "true",
      style: {
        color: 'var(--text-faint)',
        font: 'var(--type-small)'
      }
    }, "\u203A"));
  }));
}
Object.assign(__ds_scope, { Breadcrumb });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Breadcrumb.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Sidebar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Sidebar({
  brand,
  items = [],
  activeId,
  onSelect,
  footer,
  collapsed = false,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("nav", _extends({
    style: {
      width: collapsed ? 64 : 'var(--sidebar-w)',
      flex: '0 0 auto',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--surface-ink)',
      color: 'var(--text-inverse)',
      borderRadius: 'var(--radius-card)',
      padding: 'var(--space-6)',
      overflow: 'hidden',
      transition: `width var(--dur-base) var(--ease-smooth)`,
      ...style
    }
  }, rest), brand && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 'var(--space-5) var(--space-5) var(--space-9)'
    }
  }, brand), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-1)',
      flex: 1,
      minHeight: 0,
      overflowY: 'auto'
    }
  }, items.map(it => it.section ? /*#__PURE__*/React.createElement("div", {
    key: it.section,
    style: {
      font: 'var(--type-eyebrow)',
      letterSpacing: 'var(--tr-widest)',
      textTransform: 'uppercase',
      color: '#6E6E6E',
      padding: 'var(--space-9) var(--space-5) var(--space-4)'
    }
  }, collapsed ? '' : it.section) : /*#__PURE__*/React.createElement(SidebarItem, {
    key: it.id,
    item: it,
    active: it.id === activeId,
    collapsed: collapsed,
    onSelect: onSelect
  }))), footer && /*#__PURE__*/React.createElement("div", {
    style: {
      paddingTop: 'var(--space-6)',
      borderTop: '1px solid #262626',
      marginTop: 'var(--space-6)'
    }
  }, footer));
}
function SidebarItem({
  item,
  active,
  collapsed,
  onSelect
}) {
  const [hover, setHover] = React.useState(false);
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => onSelect && onSelect(item.id),
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-6)',
      width: '100%',
      height: 38,
      padding: '0 var(--space-5)',
      border: 'none',
      textAlign: 'start',
      borderRadius: 'var(--radius-md)',
      cursor: 'pointer',
      background: active ? 'var(--surface-ink-raised)' : hover ? 'rgba(255,255,255,.05)' : 'transparent',
      color: active ? 'var(--text-inverse)' : hover ? 'var(--text-inverse)' : 'var(--text-inverse-muted)',
      font: `${active ? 'var(--fw-semibold)' : 'var(--fw-regular)'} var(--fs-sm)/1 var(--font-body)`,
      transition: 'var(--transition-control)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      flex: '0 0 auto',
      color: active ? 'var(--aa-green-300)' : 'inherit'
    }
  }, item.icon), !collapsed && /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      minWidth: 0,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    }
  }, item.label), !collapsed && item.badge && /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--fw-bold) var(--fs-3xs)/1 var(--font-mono)',
      color: 'var(--aa-black)',
      background: 'var(--surface-accent)',
      borderRadius: 'var(--radius-pill)',
      padding: '3px 6px'
    }
  }, item.badge));
}
Object.assign(__ds_scope, { Sidebar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Sidebar.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Tabs.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Tabs({
  tabs = [],
  value,
  onChange,
  variant = 'underline',
  style,
  ...rest
}) {
  const underline = variant === 'underline';
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: underline ? 'var(--space-9)' : 'var(--space-1)',
      borderBottom: underline ? 'var(--rule-hairline)' : 'none',
      background: underline ? 'transparent' : 'var(--surface-sunken)',
      borderRadius: underline ? 0 : 'var(--radius-md)',
      padding: underline ? 0 : 'var(--space-2)',
      ...style
    }
  }, rest), tabs.map(t => {
    const tab = typeof t === 'string' ? {
      value: t,
      label: t
    } : t;
    const on = tab.value === value;
    return /*#__PURE__*/React.createElement("button", {
      key: tab.value,
      type: "button",
      onClick: () => onChange && onChange(tab.value),
      style: underline ? {
        border: 'none',
        background: 'transparent',
        cursor: 'pointer',
        padding: 'var(--space-5) 0',
        marginBottom: -1,
        borderBottom: `var(--bw-thick) solid ${on ? 'var(--aa-black)' : 'transparent'}`,
        font: `${on ? 'var(--fw-bold)' : 'var(--fw-medium)'} var(--fs-sm)/1 var(--font-body)`,
        color: on ? 'var(--text-strong)' : 'var(--text-muted)',
        transition: 'var(--transition-control)'
      } : {
        border: 'none',
        cursor: 'pointer',
        height: 30,
        padding: '0 var(--space-8)',
        borderRadius: 'var(--radius-sm)',
        background: on ? 'var(--surface-card)' : 'transparent',
        boxShadow: on ? 'var(--shadow-xs)' : 'none',
        font: `${on ? 'var(--fw-semibold)' : 'var(--fw-medium)'} var(--fs-sm)/1 var(--font-body)`,
        color: on ? 'var(--text-strong)' : 'var(--text-muted)',
        transition: 'var(--transition-control)'
      }
    }, tab.label, tab.count != null && /*#__PURE__*/React.createElement("span", {
      style: {
        marginInlineStart: 6,
        font: 'var(--type-mono)',
        color: 'var(--text-faint)'
      }
    }, tab.count));
  }));
}
Object.assign(__ds_scope, { Tabs });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Tabs.jsx", error: String((e && e.message) || e) }); }

// components/navigation/TopBar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function TopBar({
  brand,
  links = [],
  activeLink,
  onNavigate,
  search,
  actions,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("header", _extends({
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-10)',
      height: 'var(--topbar-h)',
      padding: '0 var(--gutter-page)',
      background: 'var(--surface-card)',
      borderBottom: 'var(--border-card)',
      ...style
    }
  }, rest), brand, /*#__PURE__*/React.createElement("nav", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-2)'
    }
  }, links.map(l => /*#__PURE__*/React.createElement(TopLink, {
    key: l.id || l.label,
    link: l,
    active: (l.id || l.label) === activeLink,
    onNavigate: onNavigate
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }), search, actions && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-5)'
    }
  }, actions));
}
function TopLink({
  link,
  active,
  onNavigate
}) {
  const [hover, setHover] = React.useState(false);
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => onNavigate && onNavigate(link.id || link.label),
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      border: 'none',
      background: hover && !active ? 'var(--surface-sunken)' : 'transparent',
      cursor: 'pointer',
      height: 32,
      padding: '0 var(--space-6)',
      borderRadius: 'var(--radius-sm)',
      font: `${active ? 'var(--fw-bold)' : 'var(--fw-medium)'} var(--fs-sm)/1 var(--font-body)`,
      color: active ? 'var(--text-strong)' : 'var(--text-muted)',
      transition: 'var(--transition-control)'
    }
  }, link.label);
}
Object.assign(__ds_scope, { TopBar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/TopBar.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Wordmark.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const SIZES = {
  sm: {
    fs: 15,
    dot: 6,
    gap: 8
  },
  md: {
    fs: 20,
    dot: 8,
    gap: 10
  },
  lg: {
    fs: 30,
    dot: 11,
    gap: 13
  }
};

/**
 * Type-only brand lockup. No logo file was supplied with the brief, so the
 * wordmark IS the mark: "ARAB AUTOMATORS" set in Bricolage Grotesque 800,
 * preceded by a single Automator Green dot borrowed from the canvas motif.
 */
function Wordmark({
  size = 'md',
  tone = 'ink',
  short = false,
  style,
  ...rest
}) {
  const s = SIZES[size] || SIZES.md;
  const fg = tone === 'inverse' ? 'var(--text-inverse)' : 'var(--text-strong)';
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: s.gap,
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    style: {
      width: s.dot,
      height: s.dot,
      borderRadius: '50%',
      background: 'var(--surface-brand)',
      flex: '0 0 auto'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      font: `var(--fw-black) ${s.fs}px/1 var(--font-display)`,
      letterSpacing: 'var(--tr-tighter)',
      color: fg,
      textTransform: 'uppercase',
      whiteSpace: 'nowrap'
    }
  }, short ? 'AA' : 'Arab Automators'));
}
Object.assign(__ds_scope, { Wordmark });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Wordmark.jsx", error: String((e && e.message) || e) }); }

// components/surfaces/DotField.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** The n8n-canvas dot field. The brand's only background texture. */
function DotField({
  children,
  tone = 'paper',
  gap,
  fade = 'none',
  radius = 'var(--radius-card)',
  style,
  ...rest
}) {
  const skin = {
    paper: {
      bg: 'var(--surface-page)',
      img: 'var(--bg-dots)'
    },
    soft: {
      bg: 'var(--surface-card)',
      img: 'var(--bg-dots-soft)'
    },
    sunken: {
      bg: 'var(--surface-sunken)',
      img: 'var(--bg-dots)'
    },
    ink: {
      bg: 'var(--surface-ink)',
      img: 'var(--bg-dots-ink)'
    },
    grid: {
      bg: 'var(--surface-card)',
      img: 'var(--bg-grid)'
    }
  }[tone] || {};
  const mask = {
    none: undefined,
    bottom: 'var(--mask-fade-b)',
    radial: 'var(--mask-fade-radial)'
  }[fade];
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      position: 'relative',
      borderRadius: radius,
      background: skin.bg,
      backgroundImage: skin.img,
      backgroundSize: gap ? `${gap}px ${gap}px` : undefined,
      WebkitMaskImage: mask,
      maskImage: mask,
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { DotField });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/surfaces/DotField.jsx", error: String((e && e.message) || e) }); }

// components/surfaces/SectionHeading.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function SectionHeading({
  eyebrow,
  title,
  children,
  align = 'start',
  rule = true,
  style,
  ...rest
}) {
  const center = align === 'center';
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-5)',
      alignItems: center ? 'center' : 'flex-start',
      textAlign: center ? 'center' : 'start',
      maxWidth: center ? 720 : undefined,
      marginInline: center ? 'auto' : undefined,
      ...style
    }
  }, rest), rule && /*#__PURE__*/React.createElement("span", {
    style: {
      width: 40,
      height: 'var(--bw-heavy)',
      background: 'var(--aa-black)',
      borderRadius: 'var(--radius-pill)'
    }
  }), eyebrow && /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--type-eyebrow)',
      letterSpacing: 'var(--tr-widest)',
      textTransform: 'uppercase',
      color: 'var(--text-accent)'
    }
  }, eyebrow), /*#__PURE__*/React.createElement("h2", {
    style: {
      font: 'var(--type-display)',
      letterSpacing: 'var(--tr-tightest)',
      color: 'var(--text-strong)',
      margin: 0
    }
  }, title), children && /*#__PURE__*/React.createElement("p", {
    style: {
      font: 'var(--fw-regular) var(--fs-lg)/var(--lh-body) var(--font-body)',
      color: 'var(--text-muted)',
      maxWidth: 'var(--prose-max)'
    }
  }, children));
}
Object.assign(__ds_scope, { SectionHeading });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/surfaces/SectionHeading.jsx", error: String((e && e.message) || e) }); }

// slides/Slides.jsx
try { (() => {
const DS = window.ArabAutomatorsDesignSystem_f5d5e6;
const SLIDE = {
  width: 1280,
  height: 720,
  position: 'relative',
  overflow: 'hidden',
  boxSizing: 'border-box'
};
function SlideFrame({
  children,
  tone = 'white',
  dots = false,
  style
}) {
  const bg = {
    white: 'var(--surface-card)',
    paper: 'var(--surface-page)',
    ink: 'var(--surface-ink)'
  }[tone];
  const img = dots ? tone === 'ink' ? 'var(--bg-dots-ink)' : 'var(--bg-dots)' : 'none';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      ...SLIDE,
      background: bg,
      backgroundImage: img,
      ...style
    }
  }, children);
}
function SlideFooter({
  label,
  page,
  inverse = false
}) {
  const {
    Wordmark
  } = DS;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 'auto 64px 40px 64px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 24
    }
  }, /*#__PURE__*/React.createElement(Wordmark, {
    size: "sm",
    tone: inverse ? 'inverse' : 'ink'
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 20,
      font: 'var(--type-mono)',
      color: inverse ? 'var(--text-inverse-muted)' : 'var(--text-faint)'
    }
  }, /*#__PURE__*/React.createElement("span", null, label), /*#__PURE__*/React.createElement("span", null, page)));
}

/* ── Title ── */
function TitleSlide() {
  const {
    Badge
  } = DS;
  return /*#__PURE__*/React.createElement(SlideFrame, {
    tone: "paper",
    dots: true
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: '0 0 auto 0',
      height: 6,
      background: 'var(--surface-brand)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: '140px 64px auto 64px'
    }
  }, /*#__PURE__*/React.createElement(Badge, {
    tone: "ink",
    dot: true
  }, "Round #1 \xB7 Module 05"), /*#__PURE__*/React.createElement("h1", {
    style: {
      font: 'var(--fw-black) 104px/0.98 var(--font-display)',
      letterSpacing: 'var(--tr-tightest)',
      color: 'var(--text-strong)',
      marginTop: 28,
      maxWidth: 1000
    }
  }, "Error handling", /*#__PURE__*/React.createElement("br", null), "and retries"), /*#__PURE__*/React.createElement("p", {
    style: {
      font: 'var(--fw-regular) 24px/1.5 var(--font-body)',
      color: 'var(--text-muted)',
      marginTop: 28,
      maxWidth: 720
    }
  }, "Make a workflow that survives a bad API response without you watching it.")), /*#__PURE__*/React.createElement(SlideFooter, {
    label: "Thursday 21:00 Cairo",
    page: "01"
  }));
}

/* ── Section divider ── */
function SectionSlide() {
  return /*#__PURE__*/React.createElement(SlideFrame, {
    tone: "ink",
    dots: true
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 'auto 64px 200px 64px'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      width: 64,
      height: 6,
      background: 'var(--surface-accent)',
      borderRadius: 999
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--fw-bold) 16px/1 var(--font-mono)',
      color: 'var(--aa-green-300)',
      letterSpacing: 'var(--tr-widest)',
      textTransform: 'uppercase',
      marginTop: 32
    }
  }, "Part two"), /*#__PURE__*/React.createElement("h2", {
    style: {
      font: 'var(--fw-black) 88px/1.0 var(--font-display)',
      letterSpacing: 'var(--tr-tightest)',
      color: 'var(--text-inverse)',
      marginTop: 18
    }
  }, "Retry with backoff")), /*#__PURE__*/React.createElement(SlideFooter, {
    label: "Module 05",
    page: "04",
    inverse: true
  }));
}

/* ── Agenda / list ── */
function AgendaSlide() {
  const items = [['01', 'Why a healthy-path workflow is unfinished', '8 min'], ['02', 'The Error Trigger node', '15 min'], ['03', 'Exponential backoff with Wait', '20 min'], ['04', 'Alerting a human who will act', '15 min'], ['05', 'Build it live', '30 min']];
  return /*#__PURE__*/React.createElement(SlideFrame, null, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: '88px 64px 120px 64px',
      display: 'grid',
      gridTemplateColumns: '360px 1fr',
      gap: 64
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      width: 48,
      height: 4,
      background: 'var(--aa-black)',
      borderRadius: 999
    }
  }), /*#__PURE__*/React.createElement("h2", {
    style: {
      font: 'var(--fw-bold) 56px/1.06 var(--font-display)',
      letterSpacing: 'var(--tr-tightest)',
      color: 'var(--text-strong)',
      marginTop: 26
    }
  }, "Tonight"), /*#__PURE__*/React.createElement("p", {
    style: {
      font: 'var(--fw-regular) 20px/1.5 var(--font-body)',
      color: 'var(--text-muted)',
      marginTop: 18
    }
  }, "90 minutes. You build alongside.")), /*#__PURE__*/React.createElement("div", null, items.map(([n, t, d], i) => /*#__PURE__*/React.createElement("div", {
    key: n,
    style: {
      display: 'flex',
      alignItems: 'baseline',
      gap: 28,
      padding: '24px 0',
      borderTop: i === 0 ? '2px solid var(--aa-neutral-950)' : '1px solid var(--border-hairline)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--fw-bold) 20px/1 var(--font-mono)',
      color: 'var(--text-accent)',
      width: 40
    }
  }, n), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      font: 'var(--fw-semibold) 28px/1.3 var(--font-body)',
      color: 'var(--text-strong)'
    }
  }, t), /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--fw-medium) 18px/1 var(--font-mono)',
      color: 'var(--text-faint)'
    }
  }, d))))), /*#__PURE__*/React.createElement(SlideFooter, {
    label: "Agenda",
    page: "02"
  }));
}

/* ── Metrics ── */
function MetricsSlide() {
  const {
    StatCard,
    Card
  } = DS;
  return /*#__PURE__*/React.createElement(SlideFrame, {
    tone: "paper"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: '88px 64px 120px 64px'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      width: 48,
      height: 4,
      background: 'var(--aa-black)',
      borderRadius: 999
    }
  }), /*#__PURE__*/React.createElement("h2", {
    style: {
      font: 'var(--fw-bold) 56px/1.06 var(--font-display)',
      letterSpacing: 'var(--tr-tightest)',
      color: 'var(--text-strong)',
      marginTop: 26
    }
  }, "Round #1, so far"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4,1fr)',
      gap: 20,
      marginTop: 48
    }
  }, [['Members', '342', '+18', 86], ['Workflows shipped', '128', '+12%', 64], ['Runs executed', '2,379', '+37%', 72], ['Curriculum done', '65%', '+9pt', 65]].map(([k, v, d, p]) => /*#__PURE__*/React.createElement(Card, {
    key: k,
    padding: "lg"
  }, /*#__PURE__*/React.createElement(StatCard, {
    eyebrow: k,
    value: v,
    delta: d,
    progress: p
  })))), /*#__PURE__*/React.createElement("p", {
    style: {
      font: 'var(--fw-regular) 22px/1.5 var(--font-body)',
      color: 'var(--text-muted)',
      marginTop: 40,
      maxWidth: 760
    }
  }, "The failure rate is 0.4%. Three of those failures came from the same unhandled HTTP node.")), /*#__PURE__*/React.createElement(SlideFooter, {
    label: "Progress",
    page: "03"
  }));
}

/* ── Comparison ── */
function ComparisonSlide() {
  const {
    Card,
    Icon,
    Badge
  } = DS;
  const cols = [{
    t: 'Without error handling',
    tone: 'danger',
    items: ['One 500 kills the run', 'Nobody finds out for a day', 'You re-run it by hand', 'The client notices first']
  }, {
    t: 'With error handling',
    tone: 'brand',
    items: ['The node retries three times', 'Backoff waits 1s, 4s, 16s', 'A Telegram message names the run', 'The workflow finishes itself']
  }];
  return /*#__PURE__*/React.createElement(SlideFrame, null, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: '88px 64px 120px 64px'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      width: 48,
      height: 4,
      background: 'var(--aa-black)',
      borderRadius: 999
    }
  }), /*#__PURE__*/React.createElement("h2", {
    style: {
      font: 'var(--fw-bold) 56px/1.06 var(--font-display)',
      letterSpacing: 'var(--tr-tightest)',
      color: 'var(--text-strong)',
      marginTop: 26
    }
  }, "The difference"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 24,
      marginTop: 44
    }
  }, cols.map(c => /*#__PURE__*/React.createElement(Card, {
    key: c.t,
    padding: "lg",
    stripe: c.tone
  }, /*#__PURE__*/React.createElement(Badge, {
    tone: c.tone === 'danger' ? 'danger' : 'brand',
    dot: true
  }, c.t), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
      marginTop: 24
    }
  }, c.items.map(i => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: 'flex',
      gap: 14,
      alignItems: 'flex-start'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: c.tone === 'danger' ? 'x' : 'check',
    size: 22,
    style: {
      color: c.tone === 'danger' ? 'var(--status-danger)' : 'var(--surface-brand)',
      marginTop: 2
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--fw-regular) 22px/1.4 var(--font-body)',
      color: 'var(--text-body)'
    }
  }, i)))))))), /*#__PURE__*/React.createElement(SlideFooter, {
    label: "Concept",
    page: "05"
  }));
}

/* ── Big quote ── */
function QuoteSlide() {
  return /*#__PURE__*/React.createElement(SlideFrame, {
    tone: "paper"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: '0 0 auto 0',
      height: 6,
      background: 'var(--surface-accent)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: '160px 96px auto 96px'
    }
  }, /*#__PURE__*/React.createElement("blockquote", {
    style: {
      margin: 0,
      font: 'var(--fw-bold) 64px/1.14 var(--font-display)',
      letterSpacing: 'var(--tr-tighter)',
      color: 'var(--text-strong)',
      textWrap: 'pretty'
    }
  }, "\u201CA workflow that only works when the API is healthy is not finished.\u201D"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      marginTop: 48
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 40,
      height: 3,
      background: 'var(--aa-black)',
      borderRadius: 999
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--fw-semibold) 22px/1 var(--font-body)',
      color: 'var(--text-muted)'
    }
  }, "Abdallah Hellal"))), /*#__PURE__*/React.createElement(SlideFooter, {
    label: "Module 05",
    page: "06"
  }));
}

/* ── Code / node walkthrough ── */
function CodeSlide() {
  const {
    Tag,
    Card
  } = DS;
  const lines = ['{ "node": "Error Trigger", "position": [0, 0] }', '{ "node": "Wait", "amount": "{{ 2 ** $runIndex }}", "unit": "seconds" }', '{ "node": "HTTP Request", "retryOnFail": true, "maxTries": 3 }', '{ "node": "Telegram", "text": "Run {{ $execution.id }} failed" }'];
  return /*#__PURE__*/React.createElement(SlideFrame, {
    tone: "paper"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: '88px 64px 120px 64px'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      width: 48,
      height: 4,
      background: 'var(--aa-black)',
      borderRadius: 999
    }
  }), /*#__PURE__*/React.createElement("h2", {
    style: {
      font: 'var(--fw-bold) 52px/1.06 var(--font-display)',
      letterSpacing: 'var(--tr-tightest)',
      color: 'var(--text-strong)',
      marginTop: 26
    }
  }, "The four nodes"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10,
      marginTop: 22
    }
  }, ['error-trigger', 'wait', 'http', 'telegram'].map(t => /*#__PURE__*/React.createElement(Tag, {
    key: t
  }, t))), /*#__PURE__*/React.createElement(Card, {
    padding: "none",
    style: {
      marginTop: 32,
      background: 'var(--surface-ink)',
      border: 'none'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '28px 32px',
      display: 'flex',
      flexDirection: 'column',
      gap: 14
    }
  }, lines.map((l, i) => /*#__PURE__*/React.createElement("div", {
    key: l,
    style: {
      display: 'flex',
      gap: 20
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--fw-medium) 18px/1.5 var(--font-mono)',
      color: '#5A5A5A',
      width: 24
    }
  }, i + 1), /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--fw-medium) 18px/1.5 var(--font-mono)',
      color: i === 1 ? 'var(--aa-amber-300)' : 'var(--aa-green-300)'
    }
  }, l)))))), /*#__PURE__*/React.createElement(SlideFooter, {
    label: "Walkthrough",
    page: "07"
  }));
}

/* ── Closing ── */
function ClosingSlide() {
  const {
    Button,
    Icon
  } = DS;
  return /*#__PURE__*/React.createElement(SlideFrame, {
    tone: "ink",
    dots: true
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 'auto 64px 180px 64px'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      width: 64,
      height: 6,
      background: 'var(--surface-accent)',
      borderRadius: 999
    }
  }), /*#__PURE__*/React.createElement("h2", {
    style: {
      font: 'var(--fw-black) 80px/1.0 var(--font-display)',
      letterSpacing: 'var(--tr-tightest)',
      color: 'var(--text-inverse)',
      marginTop: 30,
      maxWidth: 900
    }
  }, "Break it, then make it recover."), /*#__PURE__*/React.createElement("p", {
    style: {
      font: 'var(--fw-regular) 24px/1.5 var(--font-body)',
      color: 'var(--text-inverse-muted)',
      marginTop: 24,
      maxWidth: 640
    }
  }, "Assignment due Sunday 23:59 Cairo. Office hours Wednesday 20:00."), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 36
    }
  }, /*#__PURE__*/React.createElement(Button, {
    size: "lg",
    variant: "accent",
    iconEnd: /*#__PURE__*/React.createElement(Icon, {
      name: "arrow-right",
      size: 17
    })
  }, "Open the assignment"))), /*#__PURE__*/React.createElement(SlideFooter, {
    label: "Module 05",
    page: "08",
    inverse: true
  }));
}
Object.assign(window, {
  SlideFrame,
  SlideFooter,
  TitleSlide,
  SectionSlide,
  AgendaSlide,
  MetricsSlide,
  ComparisonSlide,
  QuoteSlide,
  CodeSlide,
  ClosingSlide
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "slides/Slides.jsx", error: String((e && e.message) || e) }); }

// ui_kits/community_site/ApplyPage.jsx
try { (() => {
const DS = window.ArabAutomatorsDesignSystem_f5d5e6;
function ApplyPage({
  go
}) {
  const {
    Card,
    CardHeader,
    Field,
    Input,
    Select,
    Textarea,
    RadioGroup,
    Checkbox,
    Button,
    Notice,
    Icon,
    Badge,
    Progress,
    Toast,
    SectionHeading
  } = DS;
  const [step, setStep] = React.useState(1);
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [country, setCountry] = React.useState('eg');
  const [level, setLevel] = React.useState('some');
  const [why, setWhy] = React.useState('');
  const [agree, setAgree] = React.useState(false);
  const [sent, setSent] = React.useState(false);
  const emailBad = email.length > 0 && !email.includes('@');
  if (sent) {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        padding: '80px var(--gutter-page)',
        background: 'var(--surface-page)'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        maxWidth: 620,
        margin: '0 auto'
      }
    }, /*#__PURE__*/React.createElement(Card, {
      padding: "lg",
      dots: true
    }, /*#__PURE__*/React.createElement(Badge, {
      tone: "brand",
      dot: true
    }, "Application received"), /*#__PURE__*/React.createElement("h1", {
      style: {
        font: 'var(--type-display)',
        letterSpacing: 'var(--tr-tightest)',
        color: 'var(--text-strong)',
        marginTop: 18
      }
    }, "You are in the queue."), /*#__PURE__*/React.createElement("p", {
      style: {
        font: 'var(--type-body)',
        color: 'var(--text-muted)',
        marginTop: 12
      }
    }, "We review applications every Sunday. You will hear from Abdallah within a week, from the same address you used here."), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 10,
        marginTop: 28
      }
    }, /*#__PURE__*/React.createElement(Button, {
      onClick: () => go('home')
    }, "Back to home"), /*#__PURE__*/React.createElement(Button, {
      variant: "secondary",
      onClick: () => go('curriculum')
    }, "Read the curriculum")))));
  }
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '64px var(--gutter-page) 96px',
      background: 'var(--surface-page)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 720,
      margin: '0 auto'
    }
  }, /*#__PURE__*/React.createElement(SectionHeading, {
    eyebrow: "Round #2",
    title: "Apply to the cohort."
  }, "Four questions. It takes two minutes and we read every answer."), /*#__PURE__*/React.createElement(Progress, {
    value: step === 1 ? 50 : 100,
    label: 'Step ' + step + ' of 2',
    hint: step === 1 ? '50%' : '100%',
    style: {
      marginTop: 32
    }
  }), /*#__PURE__*/React.createElement(Card, {
    padding: "lg",
    style: {
      marginTop: 20
    }
  }, step === 1 ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(CardHeader, {
    title: "About you",
    subtitle: "So we know who is in the room."
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '18px 20px'
    }
  }, /*#__PURE__*/React.createElement(Field, {
    label: "Full name",
    required: true
  }, /*#__PURE__*/React.createElement(Input, {
    value: name,
    onChange: setName,
    placeholder: "Mariam Adel"
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Email",
    required: true,
    error: emailBad ? 'That does not look like an email address.' : undefined
  }, /*#__PURE__*/React.createElement(Input, {
    value: email,
    onChange: setEmail,
    placeholder: "you@example.com",
    invalid: emailBad
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Country"
  }, /*#__PURE__*/React.createElement(Select, {
    value: country,
    onChange: setCountry,
    options: [{
      value: 'eg',
      label: 'Egypt'
    }, {
      value: 'sa',
      label: 'Saudi Arabia'
    }, {
      value: 'ae',
      label: 'United Arab Emirates'
    }, {
      value: 'jo',
      label: 'Jordan'
    }, {
      value: 'ma',
      label: 'Morocco'
    }, {
      value: 'other',
      label: 'Somewhere else'
    }]
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Weekly time you can commit",
    hint: "Sessions are 90 minutes."
  }, /*#__PURE__*/React.createElement(Select, {
    value: "6",
    onChange: () => {},
    options: [{
      value: '3',
      label: '3 hours'
    }, {
      value: '6',
      label: '6 hours'
    }, {
      value: '10',
      label: '10+ hours'
    }]
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: 10,
      marginTop: 28
    }
  }, /*#__PURE__*/React.createElement(Button, {
    onClick: () => setStep(2),
    disabled: !name || !email || emailBad,
    iconEnd: /*#__PURE__*/React.createElement(Icon, {
      name: "arrow-right",
      size: 15
    })
  }, "Continue"))) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(CardHeader, {
    title: "Your experience",
    subtitle: "Be honest \u2014 beginners get in every round."
  }), /*#__PURE__*/React.createElement(Field, {
    label: "How much automation have you built?"
  }, /*#__PURE__*/React.createElement(RadioGroup, {
    value: level,
    onChange: setLevel,
    options: [{
      value: 'none',
      label: 'None yet',
      description: 'I have heard of n8n or Zapier but never built anything.'
    }, {
      value: 'some',
      label: 'A few workflows',
      description: 'I have connected two or three tools for myself.'
    }, {
      value: 'paid',
      label: 'Paid work',
      description: 'I have shipped automations for a client or employer.'
    }]
  })), /*#__PURE__*/React.createElement(Field, {
    label: "What do you want running by week six?",
    hint: "One sentence is enough.",
    style: {
      marginTop: 20
    }
  }, /*#__PURE__*/React.createElement(Textarea, {
    value: why,
    onChange: setWhy,
    rows: 3,
    placeholder: "A workflow that reads my client's invoices and files them automatically."
  })), /*#__PURE__*/React.createElement(Notice, {
    tone: "info",
    title: "Sessions are Thursdays 21:00 Cairo",
    icon: /*#__PURE__*/React.createElement(Icon, {
      name: "clock",
      size: 16
    }),
    style: {
      marginTop: 20
    }
  }, "Recordings go up the same night if you cannot attend live."), /*#__PURE__*/React.createElement(Checkbox, {
    checked: agree,
    onChange: setAgree,
    style: {
      marginTop: 20
    },
    label: "I can attend or watch every session",
    description: "Round #1 members who missed three sessions did not finish."
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      gap: 10,
      marginTop: 28
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    onClick: () => setStep(1)
  }, "Back"), /*#__PURE__*/React.createElement(Button, {
    onClick: () => setSent(true),
    disabled: !agree || !why
  }, "Submit application"))))));
}
Object.assign(window, {
  ApplyPage
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/community_site/ApplyPage.jsx", error: String((e && e.message) || e) }); }

// ui_kits/community_site/CommunityPage.jsx
try { (() => {
const DS = window.ArabAutomatorsDesignSystem_f5d5e6;
const COMMUNITY_FEED = [{
  name: 'Mariam Adel',
  when: '2h',
  title: 'Invoice OCR that files into Drive by client name',
  tags: ['http', 'openai', 'drive'],
  runs: 318,
  state: 'Live'
}, {
  name: 'Youssef Kamal',
  when: '6h',
  title: 'Attendance reminder for the cohort Telegram group',
  tags: ['telegram', 'schedule'],
  runs: 211,
  state: 'Live'
}, {
  name: 'Sara Fouad',
  when: 'Yesterday',
  title: 'Notion to Sheets sync with conflict detection',
  tags: ['notion', 'sheets'],
  runs: 12,
  state: 'Draft'
}, {
  name: 'Omar Nabil',
  when: '2d',
  title: 'Daily Slack digest of failed runs across a workspace',
  tags: ['slack', 'error-trigger'],
  runs: 96,
  state: 'Live'
}];
function CommunityPage() {
  const {
    Card,
    CardHeader,
    Avatar,
    Badge,
    Tag,
    Button,
    Icon,
    Tabs,
    ListRow,
    DataTable,
    SectionHeading,
    Notice
  } = DS;
  const [tab, setTab] = React.useState('feed');
  const tone = {
    Live: 'brand',
    Draft: 'outline'
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '56px var(--gutter-page) 96px',
      background: 'var(--surface-page)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 'var(--content-max)',
      margin: '0 auto'
    }
  }, /*#__PURE__*/React.createElement(SectionHeading, {
    eyebrow: "Community",
    title: "What the cohort shipped this week."
  }, "Every member publishes their workflow. Anyone in the community can copy the JSON."), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 32
    }
  }, /*#__PURE__*/React.createElement(Tabs, {
    value: tab,
    onChange: setTab,
    tabs: [{
      value: 'feed',
      label: 'Recent builds',
      count: 128
    }, {
      value: 'leaders',
      label: 'Leaderboard'
    }]
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1.6fr 1fr',
      gap: 24,
      marginTop: 28,
      alignItems: 'start'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 16
    }
  }, tab === 'feed' ? COMMUNITY_FEED.map(p => /*#__PURE__*/React.createElement(Card, {
    key: p.title
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: p.name,
    size: "md"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--type-body-strong)',
      color: 'var(--text-strong)'
    }
  }, p.name), /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--type-mono)',
      color: 'var(--text-faint)'
    }
  }, p.when, " ago")), /*#__PURE__*/React.createElement(Badge, {
    tone: tone[p.state],
    dot: true,
    size: "sm"
  }, p.state)), /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--type-title)',
      color: 'var(--text-strong)',
      marginTop: 16
    }
  }, p.title), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6,
      flexWrap: 'wrap',
      marginTop: 14
    }
  }, p.tags.map(t => /*#__PURE__*/React.createElement(Tag, {
    key: t
  }, t))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 18,
      paddingTop: 14,
      borderTop: 'var(--rule-hairline)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--type-mono)',
      color: 'var(--text-muted)'
    }
  }, p.runs.toLocaleString(), " runs"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    variant: "ghost",
    iconStart: /*#__PURE__*/React.createElement(Icon, {
      name: "message-circle",
      size: 15
    })
  }, "Discuss"), /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    variant: "secondary",
    iconStart: /*#__PURE__*/React.createElement(Icon, {
      name: "copy",
      size: 15
    })
  }, "Copy JSON"))))) : /*#__PURE__*/React.createElement(Card, {
    padding: "sm"
  }, /*#__PURE__*/React.createElement(DataTable, {
    dense: true,
    columns: [{
      key: 'rank',
      label: '#',
      mono: true,
      width: 50
    }, {
      key: 'name',
      label: 'Member',
      strong: true
    }, {
      key: 'city',
      label: 'City'
    }, {
      key: 'shipped',
      label: 'Shipped',
      mono: true,
      align: 'end'
    }, {
      key: 'runs',
      label: 'Runs',
      mono: true,
      align: 'end'
    }],
    rows: [{
      rank: '01',
      name: 'Abdallah Hellal',
      city: 'Cairo',
      shipped: 12,
      runs: '2,046'
    }, {
      rank: '02',
      name: 'Mariam Adel',
      city: 'Alexandria',
      shipped: 5,
      runs: '318'
    }, {
      rank: '03',
      name: 'Youssef Kamal',
      city: 'Giza',
      shipped: 3,
      runs: '211'
    }, {
      rank: '04',
      name: 'Omar Nabil',
      city: 'Amman',
      shipped: 1,
      runs: '96'
    }, {
      rank: '05',
      name: 'Sara Fouad',
      city: 'Riyadh',
      shipped: 2,
      runs: '12'
    }]
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement(Notice, {
    tone: "warning",
    title: "Office hours Wednesday 20:00",
    icon: /*#__PURE__*/React.createElement(Icon, {
      name: "video",
      size: 16
    }),
    action: /*#__PURE__*/React.createElement(Button, {
      size: "sm",
      variant: "secondary"
    }, "Add question")
  }, "Bring a failing run URL and it gets debugged live."), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(CardHeader, {
    title: "Most copied snippets",
    subtitle: "Across the whole community"
  }), [['Retry with exponential backoff', '128 copies'], ['Normalize WhatsApp payload', '94 copies'], ['Chunk a Sheets range', '61 copies']].map(([t, m], i) => /*#__PURE__*/React.createElement(ListRow, {
    key: t,
    title: t,
    meta: m,
    divider: i < 2,
    onClick: () => {},
    icon: /*#__PURE__*/React.createElement(Icon, {
      name: "code",
      size: 16
    })
  }))), /*#__PURE__*/React.createElement(Card, {
    dots: true
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--type-eyebrow)',
      letterSpacing: 'var(--tr-widest)',
      textTransform: 'uppercase',
      color: 'var(--text-muted)'
    }
  }, "Community"), /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--fw-bold) var(--fs-2xl)/1.15 var(--font-display)',
      letterSpacing: 'var(--tr-tighter)',
      color: 'var(--text-strong)',
      marginTop: 6
    }
  }, "342 members in 9 countries"), /*#__PURE__*/React.createElement("p", {
    style: {
      font: 'var(--type-small)',
      color: 'var(--text-muted)',
      marginTop: 8
    }
  }, "Alumni keep access to the library and office hours after the round ends."))))));
}
Object.assign(window, {
  CommunityPage
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/community_site/CommunityPage.jsx", error: String((e && e.message) || e) }); }

// ui_kits/community_site/CurriculumPage.jsx
try { (() => {
const DS = window.ArabAutomatorsDesignSystem_f5d5e6;
const CURRICULUM_MODULES = [{
  n: '01',
  t: 'What automation actually is',
  wk: 'Week 1',
  ship: 'A one-page map of your own repetitive work',
  tags: ['concepts'],
  d: 'Where automation pays off and where it quietly wastes your week. You leave with a shortlist of things worth automating and a reason for each.'
}, {
  n: '02',
  t: 'Your first n8n canvas',
  wk: 'Week 2',
  ship: 'A workflow that runs on a button press',
  tags: ['n8n', 'set'],
  d: 'Nodes, connections, the run panel, and reading an execution. Everything after this assumes you can build and debug a two-node flow without help.'
}, {
  n: '03',
  t: 'Triggers, webhooks and schedules',
  wk: 'Week 3',
  ship: 'A webhook that fires from a real form',
  tags: ['webhook', 'schedule'],
  d: 'Make a workflow start on its own. Cron, webhooks, polling, and how to tell which one a job actually needs.'
}, {
  n: '04',
  t: 'HTTP and APIs',
  wk: 'Week 4',
  ship: 'A workflow that reads a paginated API',
  tags: ['http', 'openai'],
  d: 'Authenticate, paginate, and parse a response you have never seen before. Reading docs is part of the session, on purpose.'
}, {
  n: '05',
  t: 'Error handling and retries',
  wk: 'Week 5',
  ship: 'A workflow that recovers from a 500',
  tags: ['error-trigger', 'wait'],
  d: 'A workflow that only works when the API is healthy is not finished. Error triggers, backoff, and alerting a human who will act.'
}, {
  n: '06',
  t: 'Shipping to a client',
  wk: 'Week 6',
  ship: 'A handover doc and a price',
  tags: ['delivery'],
  d: 'Handover, credentials, pricing, and what you owe a client after launch. The uncomfortable half of freelance automation work.'
}];
function CurriculumPage({
  go
}) {
  const {
    Card,
    Badge,
    Tag,
    Button,
    Icon,
    SectionHeading,
    DataTable,
    Notice,
    DotField
  } = DS;
  const [open, setOpen] = React.useState('05');
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(DotField, {
    tone: "paper",
    fade: "bottom",
    radius: "0",
    style: {
      padding: '72px var(--gutter-page) 56px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 'var(--content-max)',
      margin: '0 auto'
    }
  }, /*#__PURE__*/React.createElement(SectionHeading, {
    eyebrow: "Round #2 curriculum",
    title: "Six weeks, six shipped things."
  }, "One 90-minute live session per week in Arabic, plus office hours. Recording and workflow JSON the same night."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 12,
      marginTop: 28,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement(Button, {
    onClick: () => go('apply'),
    iconEnd: /*#__PURE__*/React.createElement(Icon, {
      name: "arrow-right",
      size: 15
    })
  }, "Apply for Round #2"), /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    iconStart: /*#__PURE__*/React.createElement(Icon, {
      name: "download",
      size: 15
    })
  }, "Download syllabus")))), /*#__PURE__*/React.createElement("section", {
    style: {
      background: 'var(--surface-card)',
      padding: '64px var(--gutter-page)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 'var(--content-max)',
      margin: '0 auto',
      display: 'grid',
      gridTemplateColumns: '1.5fr 1fr',
      gap: 40,
      alignItems: 'start'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 12
    }
  }, CURRICULUM_MODULES.map(m => {
    const on = open === m.n;
    return /*#__PURE__*/React.createElement(Card, {
      key: m.n,
      stripe: on ? 'brand' : undefined,
      onClick: () => setOpen(on ? null : m.n),
      style: {
        cursor: 'pointer'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 16
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        font: 'var(--fw-black) var(--fs-lg)/1 var(--font-mono)',
        color: on ? 'var(--text-accent)' : 'var(--text-faint)',
        width: 30
      }
    }, m.n), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        font: 'var(--type-heading)',
        color: 'var(--text-strong)'
      }
    }, m.t), /*#__PURE__*/React.createElement("div", {
      style: {
        font: 'var(--type-mono)',
        color: 'var(--text-muted)',
        marginTop: 3
      }
    }, m.wk)), /*#__PURE__*/React.createElement(Icon, {
      name: on ? 'minus' : 'plus',
      size: 18,
      style: {
        color: 'var(--text-muted)'
      }
    })), on && /*#__PURE__*/React.createElement("div", {
      className: "aa-rise",
      style: {
        marginTop: 16,
        paddingTop: 16,
        borderTop: 'var(--rule-hairline)'
      }
    }, /*#__PURE__*/React.createElement("p", {
      style: {
        font: 'var(--type-body)',
        color: 'var(--text-body)',
        maxWidth: 'var(--prose-max)'
      }
    }, m.d), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        flexWrap: 'wrap',
        marginTop: 16
      }
    }, /*#__PURE__*/React.createElement(Badge, {
      tone: "brand",
      dot: true
    }, "Ships: ", m.ship), m.tags.map(t => /*#__PURE__*/React.createElement(Tag, {
      key: t
    }, t)))));
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
      position: 'sticky',
      top: 96
    }
  }, /*#__PURE__*/React.createElement(Card, {
    padding: "lg"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--type-eyebrow)',
      letterSpacing: 'var(--tr-widest)',
      textTransform: 'uppercase',
      color: 'var(--text-muted)'
    }
  }, "Round #2"), /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--type-metric)',
      letterSpacing: 'var(--tr-tightest)',
      color: 'var(--text-strong)',
      marginTop: 6
    }
  }, "12 Sept"), /*#__PURE__*/React.createElement("p", {
    style: {
      font: 'var(--type-small)',
      color: 'var(--text-muted)',
      marginTop: 6
    }
  }, "Applications close when 400 seats fill."), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 20,
      display: 'flex',
      flexDirection: 'column',
      gap: 10
    }
  }, [['Sessions', 'Thursdays 21:00 Cairo'], ['Language', 'Arabic'], ['Length', '6 weeks · 90 min'], ['Office hours', 'Wednesdays']].map(([k, v]) => /*#__PURE__*/React.createElement("div", {
    key: k,
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      gap: 12,
      font: 'var(--type-small)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-muted)'
    }
  }, k), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-strong)',
      fontWeight: 'var(--fw-semibold)'
    }
  }, v)))), /*#__PURE__*/React.createElement(Button, {
    block: true,
    style: {
      marginTop: 22
    },
    onClick: () => go('apply')
  }, "Apply now")), /*#__PURE__*/React.createElement(Notice, {
    tone: "info",
    title: "Prerequisites: none",
    icon: /*#__PURE__*/React.createElement(Icon, {
      name: "info",
      size: 16
    })
  }, "You need a laptop and a free n8n account. No code experience assumed.")))));
}
Object.assign(window, {
  CurriculumPage
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/community_site/CurriculumPage.jsx", error: String((e && e.message) || e) }); }

// ui_kits/community_site/HomePage.jsx
try { (() => {
const DS = window.ArabAutomatorsDesignSystem_f5d5e6;
const HOME_PILLARS = [{
  icon: 'workflow',
  t: 'Build on a real canvas',
  d: 'Every session happens inside n8n. You leave with a workflow running, not notes about one.'
}, {
  icon: 'users',
  t: 'A cohort, not a course',
  d: 'Round #1 shipped 128 workflows together. Office hours, reviews, and a shared snippet library.'
}, {
  icon: 'globe',
  t: 'Arabic-first',
  d: 'Taught in Arabic, documented in Arabic. The tools stay in English because the industry does.'
}];
const HOME_MODULES = [['01', 'What automation actually is', 'Where automation pays off, and where it wastes your week.'], ['02', 'Your first n8n canvas', 'Nodes, connections, and the run panel. Ship something on day one.'], ['03', 'Triggers, webhooks and schedules', 'Make a workflow start on its own.'], ['04', 'HTTP and APIs', 'Authenticate, paginate, and read a response you have never seen before.'], ['05', 'Error handling and retries', 'Survive a bad response without watching the screen.'], ['06', 'Shipping to a client', 'Handover, pricing, and what you owe them after launch.']];
function HomePage({
  go
}) {
  const {
    DotField,
    SectionHeading,
    Button,
    Icon,
    Card,
    Badge,
    Tag,
    Notice,
    Avatar,
    StatCard
  } = DS;
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(DotField, {
    tone: "paper",
    fade: "bottom",
    radius: "0",
    style: {
      padding: '104px var(--gutter-page) 88px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 'var(--content-max)',
      margin: '0 auto'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      marginBottom: 22
    }
  }, /*#__PURE__*/React.createElement(Badge, {
    tone: "ink",
    dot: true
  }, "Round #2 \xB7 applications open"), /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--type-mono)',
      color: 'var(--text-muted)'
    }
  }, "184 on the waitlist")), /*#__PURE__*/React.createElement("h1", {
    style: {
      font: 'var(--fw-black) clamp(48px,7vw,96px)/0.98 var(--font-display)',
      letterSpacing: 'var(--tr-tightest)',
      color: 'var(--text-strong)',
      maxWidth: 900
    }
  }, "Learn automation", /*#__PURE__*/React.createElement("br", null), "by shipping it."), /*#__PURE__*/React.createElement("p", {
    style: {
      font: 'var(--fw-regular) var(--fs-xl)/var(--lh-body) var(--font-body)',
      color: 'var(--text-muted)',
      maxWidth: 620,
      marginTop: 24
    }
  }, "Six weeks, one cohort, and a working automation at the end of every session. Built by Pixtaha and Abdallah Hellal for the Arabic-speaking web."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 12,
      marginTop: 36,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement(Button, {
    size: "lg",
    onClick: () => go('apply'),
    iconEnd: /*#__PURE__*/React.createElement(Icon, {
      name: "arrow-right",
      size: 16
    })
  }, "Apply for Round #2"), /*#__PURE__*/React.createElement(Button, {
    size: "lg",
    variant: "secondary",
    onClick: () => go('curriculum')
  }, "See the curriculum")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4,1fr)',
      gap: 16,
      marginTop: 72
    }
  }, [['Members in Round #1', '342'], ['Workflows shipped', '128'], ['Runs executed', '2,379'], ['Completion rate', '65%']].map(([k, v]) => /*#__PURE__*/React.createElement("div", {
    key: k,
    style: {
      background: 'var(--surface-card)',
      border: 'var(--border-card)',
      borderRadius: 'var(--radius-card)',
      padding: 'var(--pad-card)',
      boxShadow: 'var(--shadow-sm)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--type-eyebrow)',
      letterSpacing: 'var(--tr-widest)',
      textTransform: 'uppercase',
      color: 'var(--text-muted)'
    }
  }, k), /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--type-metric)',
      letterSpacing: 'var(--tr-tightest)',
      color: 'var(--text-strong)',
      marginTop: 6
    }
  }, v)))))), /*#__PURE__*/React.createElement(Section, {
    tone: "white"
  }, /*#__PURE__*/React.createElement(SectionHeading, {
    eyebrow: "How it works",
    title: "Three things that make it stick."
  }, "The program is deliberately small. No pre-recorded library, no certificate, no dashboard of unwatched videos."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3,1fr)',
      gap: 16,
      marginTop: 48
    }
  }, HOME_PILLARS.map(p => /*#__PURE__*/React.createElement(Card, {
    key: p.t,
    padding: "lg"
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 44,
      height: 44,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 'var(--radius-md)',
      background: 'var(--surface-brand-soft)',
      color: 'var(--aa-green-700)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: p.icon,
    size: 20
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--type-title)',
      color: 'var(--text-strong)',
      marginTop: 20
    }
  }, p.t), /*#__PURE__*/React.createElement("p", {
    style: {
      font: 'var(--type-body)',
      color: 'var(--text-muted)',
      marginTop: 10
    }
  }, p.d))))), /*#__PURE__*/React.createElement(Section, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1.15fr',
      gap: 56,
      alignItems: 'start'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'sticky',
      top: 96
    }
  }, /*#__PURE__*/React.createElement(SectionHeading, {
    eyebrow: "Curriculum",
    title: "Six modules. Six shipped things."
  }, "One live session per week, 90 minutes, in Arabic. Recording and workflow JSON the same night."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      flexWrap: 'wrap',
      marginTop: 24
    }
  }, ['n8n', 'webhook', 'http', 'openai', 'supabase', 'telegram'].map(t => /*#__PURE__*/React.createElement(Tag, {
    key: t
  }, t))), /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    style: {
      marginTop: 28
    },
    onClick: () => go('curriculum')
  }, "Full syllabus")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column'
    }
  }, HOME_MODULES.map(([n, t, d], i) => /*#__PURE__*/React.createElement("div", {
    key: n,
    style: {
      display: 'flex',
      gap: 20,
      padding: '22px 0',
      borderTop: i === 0 ? 'var(--rule-thick)' : 'var(--rule-hairline)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--fw-bold) var(--fs-sm)/1 var(--font-mono)',
      color: 'var(--text-accent)',
      paddingTop: 4,
      width: 26
    }
  }, n), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--type-heading)',
      color: 'var(--text-strong)'
    }
  }, t), /*#__PURE__*/React.createElement("p", {
    style: {
      font: 'var(--type-small)',
      color: 'var(--text-muted)',
      marginTop: 4
    }
  }, d))))))), /*#__PURE__*/React.createElement(Section, {
    tone: "white"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 56,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(SectionHeading, {
    eyebrow: "Who runs it",
    title: "Two people who build this daily."
  }, "No guest instructors, no teaching assistants reading a script.")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 14
    }
  }, [['Pixtaha', 'AI automation engineer', 'Builds intake, OCR and reporting automations for agencies. Runs the technical sessions.'], ['Abdallah Hellal', 'Co-founder', 'Handles client delivery and the review process. Runs office hours and the failure clinics.']].map(([n, r, d]) => /*#__PURE__*/React.createElement(Card, {
    key: n,
    padding: "lg"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 16,
      alignItems: 'flex-start'
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: n,
    size: "xl",
    tone: n === 'Pixtaha' ? 'ink' : 'brand'
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--type-heading)',
      color: 'var(--text-strong)'
    }
  }, n), /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--type-mono)',
      color: 'var(--text-accent)',
      marginTop: 3
    }
  }, r), /*#__PURE__*/React.createElement("p", {
    style: {
      font: 'var(--type-small)',
      color: 'var(--text-muted)',
      marginTop: 10
    }
  }, d)))))))), /*#__PURE__*/React.createElement(DotField, {
    tone: "ink",
    radius: "0",
    style: {
      padding: 'var(--section-y) var(--gutter-page)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 'var(--content-max)',
      margin: '0 auto',
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      gap: 40,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      width: 40,
      height: 3,
      background: 'var(--surface-accent)',
      borderRadius: 999
    }
  }), /*#__PURE__*/React.createElement("h2", {
    style: {
      font: 'var(--fw-black) var(--fs-5xl)/1.02 var(--font-display)',
      letterSpacing: 'var(--tr-tightest)',
      color: 'var(--text-inverse)',
      marginTop: 20,
      maxWidth: 620
    }
  }, "Round #2 caps at 400 seats."), /*#__PURE__*/React.createElement("p", {
    style: {
      font: 'var(--fw-regular) var(--fs-lg)/var(--lh-body) var(--font-body)',
      color: 'var(--text-inverse-muted)',
      marginTop: 16,
      maxWidth: 520
    }
  }, "Applications close when the cohort fills. Round #1 filled in nine days.")), /*#__PURE__*/React.createElement(Button, {
    size: "lg",
    variant: "accent",
    onClick: () => go('apply'),
    iconEnd: /*#__PURE__*/React.createElement(Icon, {
      name: "arrow-right",
      size: 16
    })
  }, "Apply now"))));
}
Object.assign(window, {
  HomePage
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/community_site/HomePage.jsx", error: String((e && e.message) || e) }); }

// ui_kits/community_site/SiteChrome.jsx
try { (() => {
const DS = window.ArabAutomatorsDesignSystem_f5d5e6;
function SiteHeader({
  route,
  go
}) {
  const {
    TopBar,
    Wordmark,
    Button,
    Icon
  } = DS;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'sticky',
      top: 0,
      zIndex: 30
    }
  }, /*#__PURE__*/React.createElement(TopBar, {
    brand: /*#__PURE__*/React.createElement(Wordmark, {
      size: "sm"
    }),
    links: [{
      id: 'home',
      label: 'Home'
    }, {
      id: 'curriculum',
      label: 'Curriculum'
    }, {
      id: 'community',
      label: 'Community'
    }, {
      id: 'apply',
      label: 'Apply'
    }],
    activeLink: route,
    onNavigate: go,
    actions: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Button, {
      variant: "ghost",
      size: "sm"
    }, "Sign in"), /*#__PURE__*/React.createElement(Button, {
      variant: "ink",
      size: "sm",
      iconEnd: /*#__PURE__*/React.createElement(Icon, {
        name: "arrow-right",
        size: 15
      }),
      onClick: () => go('apply')
    }, "Join Round #2"))
  }));
}
function SiteFooter({
  go
}) {
  const {
    Wordmark,
    Icon
  } = DS;
  const cols = [['Program', ['Curriculum', 'Round #2 dates', 'Pricing', 'FAQ']], ['Community', ['Member workflows', 'Snippet library', 'Office hours', 'Alumni']], ['Team', ['Pixtaha', 'Abdallah Hellal', 'Contact']]];
  return /*#__PURE__*/React.createElement("footer", {
    style: {
      background: 'var(--surface-ink)',
      color: 'var(--text-inverse)',
      padding: '64px var(--gutter-page) 32px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 'var(--content-max)',
      margin: '0 auto',
      display: 'grid',
      gridTemplateColumns: '1.4fr repeat(3,1fr)',
      gap: 40
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Wordmark, {
    size: "sm",
    tone: "inverse"
  }), /*#__PURE__*/React.createElement("p", {
    style: {
      font: 'var(--type-small)',
      color: 'var(--text-inverse-muted)',
      marginTop: 14,
      maxWidth: 260
    }
  }, "An Arabic-first community for people who build automations instead of talking about them.")), cols.map(([h, links]) => /*#__PURE__*/React.createElement("div", {
    key: h
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--type-eyebrow)',
      letterSpacing: 'var(--tr-widest)',
      textTransform: 'uppercase',
      color: '#6E6E6E'
    }
  }, h), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      marginTop: 14
    }
  }, links.map(l => /*#__PURE__*/React.createElement("a", {
    key: l,
    href: "#",
    onClick: e => {
      e.preventDefault();
      go('curriculum');
    },
    style: {
      font: 'var(--type-small)',
      color: 'var(--text-inverse-muted)',
      textDecoration: 'none'
    }
  }, l)))))), /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 'var(--content-max)',
      margin: '40px auto 0',
      paddingTop: 20,
      borderTop: '1px solid #262626',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 20
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--type-mono)',
      color: '#6E6E6E'
    }
  }, "\xA9 2026 Arab Automators"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 14,
      color: '#6E6E6E'
    }
  }, ['youtube', 'send', 'linkedin', 'github'].map(n => /*#__PURE__*/React.createElement(Icon, {
    key: n,
    name: n,
    size: 16
  })))));
}
function Section({
  children,
  tone = 'paper',
  style
}) {
  const bg = {
    paper: 'var(--surface-page)',
    white: 'var(--surface-card)',
    sunken: 'var(--surface-sunken)'
  }[tone];
  return /*#__PURE__*/React.createElement("section", {
    style: {
      background: bg,
      padding: 'var(--section-y) var(--gutter-page)',
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 'var(--content-max)',
      margin: '0 auto'
    }
  }, children));
}
Object.assign(window, {
  SiteHeader,
  SiteFooter,
  Section
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/community_site/SiteChrome.jsx", error: String((e && e.message) || e) }); }

// ui_kits/dashboard/AppShell.jsx
try { (() => {
const DS = window.ArabAutomatorsDesignSystem_f5d5e6;
function AppShell({
  view,
  setView,
  children
}) {
  const {
    Sidebar,
    Wordmark,
    Icon,
    Avatar,
    IconButton
  } = DS;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 16,
      padding: 16,
      minHeight: '100vh',
      minWidth: 1240,
      boxSizing: 'border-box',
      background: 'var(--surface-app)'
    }
  }, /*#__PURE__*/React.createElement(Sidebar, {
    activeId: view,
    onSelect: setView,
    brand: /*#__PURE__*/React.createElement(Wordmark, {
      size: "sm",
      tone: "inverse"
    }),
    style: {
      position: 'sticky',
      top: 16,
      height: 'calc(100vh - 32px)'
    },
    items: [{
      section: 'Workspace'
    }, {
      id: 'overview',
      label: 'Overview',
      icon: /*#__PURE__*/React.createElement(Icon, {
        name: "layout-dashboard",
        size: 16
      })
    }, {
      id: 'workflows',
      label: 'Workflows',
      icon: /*#__PURE__*/React.createElement(Icon, {
        name: "workflow",
        size: 16
      }),
      badge: 3
    }, {
      id: 'members',
      label: 'Members',
      icon: /*#__PURE__*/React.createElement(Icon, {
        name: "users",
        size: 16
      })
    }, {
      section: 'Round #1'
    }, {
      id: 'lesson',
      label: 'Curriculum',
      icon: /*#__PURE__*/React.createElement(Icon, {
        name: "graduation-cap",
        size: 16
      })
    }, {
      id: 'library',
      label: 'Snippet library',
      icon: /*#__PURE__*/React.createElement(Icon, {
        name: "code",
        size: 16
      })
    }],
    footer: /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '4px 6px'
      }
    }, /*#__PURE__*/React.createElement(Avatar, {
      name: "Pixtaha",
      size: "sm",
      tone: "brand"
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        font: 'var(--fw-semibold) var(--fs-xs)/1.3 var(--font-body)',
        color: 'var(--text-inverse)'
      }
    }, "Pixtaha"), /*#__PURE__*/React.createElement("div", {
      style: {
        font: 'var(--fs-3xs)/1.3 var(--font-body)',
        color: 'var(--text-inverse-muted)'
      }
    }, "Instructor")), /*#__PURE__*/React.createElement(IconButton, {
      label: "Settings",
      style: {
        color: 'var(--text-inverse-muted)'
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "settings",
      size: 15
    })))
  }), /*#__PURE__*/React.createElement("main", {
    style: {
      flex: 1,
      minWidth: 0,
      display: 'flex',
      flexDirection: 'column',
      gap: 16
    }
  }, children));
}
function PageHead({
  eyebrow,
  title,
  subtitle,
  actions,
  tabs
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-end',
      gap: 20,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 320
    }
  }, eyebrow && /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--type-eyebrow)',
      letterSpacing: 'var(--tr-widest)',
      textTransform: 'uppercase',
      color: 'var(--text-accent)',
      marginBottom: 6
    }
  }, eyebrow), /*#__PURE__*/React.createElement("h1", {
    style: {
      font: 'var(--fw-bold) var(--fs-3xl)/1.15 var(--font-display)',
      letterSpacing: 'var(--tr-tightest)',
      color: 'var(--text-strong)'
    }
  }, title), subtitle && /*#__PURE__*/React.createElement("p", {
    style: {
      font: 'var(--type-body)',
      color: 'var(--text-muted)',
      marginTop: 6
    }
  }, subtitle)), actions && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10
    }
  }, actions)), tabs);
}
function SearchField({
  value,
  onChange,
  placeholder = 'Search…',
  width = 260
}) {
  const {
    Icon
  } = DS;
  const [focus, setFocus] = React.useState(false);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      width,
      height: 38,
      padding: '0 12px',
      background: 'var(--surface-card)',
      borderRadius: 'var(--radius-control)',
      border: '1px solid ' + (focus ? 'var(--border-focus)' : 'var(--border-hairline)'),
      boxShadow: focus ? 'var(--ring-focus)' : 'none',
      transition: 'var(--transition-control)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "search",
    size: 15,
    style: {
      color: 'var(--text-faint)'
    }
  }), /*#__PURE__*/React.createElement("input", {
    value: value,
    onChange: e => onChange(e.target.value),
    placeholder: placeholder,
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    style: {
      flex: 1,
      minWidth: 0,
      border: 'none',
      outline: 'none',
      background: 'transparent',
      font: 'var(--type-small)',
      color: 'var(--text-strong)'
    }
  }));
}
Object.assign(window, {
  AppShell,
  PageHead,
  SearchField
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/dashboard/AppShell.jsx", error: String((e && e.message) || e) }); }

// ui_kits/dashboard/LessonScreen.jsx
try { (() => {
const DS = window.ArabAutomatorsDesignSystem_f5d5e6;
const LESSON_MODULES = [{
  n: '01',
  t: 'What automation actually is',
  done: true
}, {
  n: '02',
  t: 'Your first n8n canvas',
  done: true
}, {
  n: '03',
  t: 'Triggers, webhooks and schedules',
  done: true
}, {
  n: '04',
  t: 'HTTP and APIs',
  done: true
}, {
  n: '05',
  t: 'Error handling and retries',
  done: false,
  current: true
}, {
  n: '06',
  t: 'Shipping to a client',
  done: false
}];
function LessonScreen() {
  const {
    Card,
    CardHeader,
    Button,
    Icon,
    Badge,
    Checkbox,
    Breadcrumb,
    Progress,
    DotField,
    Notice,
    Tag
  } = DS;
  const [checks, setChecks] = React.useState([true, true, false, false]);
  const toggle = i => setChecks(c => c.map((v, j) => j === i ? !v : v));
  const tasks = ['Wrap the HTTP node in an Error Trigger branch', 'Add exponential backoff with a Wait node', 'Post failures to the cohort Telegram channel', 'Submit the workflow JSON for review'];
  const doneCount = checks.filter(Boolean).length;
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Breadcrumb, {
    items: [{
      label: 'Curriculum',
      href: '#'
    }, {
      label: 'Round #1',
      href: '#'
    }, {
      label: 'Module 05'
    }]
  }), /*#__PURE__*/React.createElement(PageHead, {
    eyebrow: "Module 05 \xB7 Week 6",
    title: "Error handling and retries",
    subtitle: "Make a workflow that survives a bad API response without you watching it.",
    actions: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Button, {
      variant: "secondary",
      iconStart: /*#__PURE__*/React.createElement(Icon, {
        name: "download",
        size: 15
      })
    }, "Workflow JSON"), /*#__PURE__*/React.createElement(Button, {
      variant: "ink",
      iconStart: /*#__PURE__*/React.createElement(Icon, {
        name: "check",
        size: 15
      })
    }, "Mark complete"))
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1.5fr 1fr',
      gap: 16,
      alignItems: 'start'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement(Card, {
    padding: "none"
  }, /*#__PURE__*/React.createElement(DotField, {
    tone: "grid",
    radius: "0",
    style: {
      aspectRatio: '16 / 9',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderBottom: 'var(--rule-hairline)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--type-eyebrow)',
      letterSpacing: 'var(--tr-widest)',
      textTransform: 'uppercase',
      color: 'var(--text-faint)'
    }
  }, "Session recording"), /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--type-small)',
      color: 'var(--text-faint)',
      marginTop: 6
    }
  }, "No media supplied \u2014 placeholder"))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 'var(--pad-card)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      flexWrap: 'wrap',
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement(Tag, null, "error-trigger"), /*#__PURE__*/React.createElement(Tag, null, "wait"), /*#__PURE__*/React.createElement(Tag, null, "http"), /*#__PURE__*/React.createElement(Tag, null, "telegram")), /*#__PURE__*/React.createElement("p", {
    style: {
      font: 'var(--fw-regular) var(--fs-md)/var(--lh-body) var(--font-body)',
      color: 'var(--text-body)',
      maxWidth: 'var(--prose-max)'
    }
  }, "A workflow that only works when the API is healthy is not finished. In this session you wrap a live HTTP call in an Error Trigger, retry it with backoff, and report the failure somewhere a human will actually see it."), /*#__PURE__*/React.createElement("p", {
    style: {
      font: 'var(--fw-regular) var(--fs-md)/var(--lh-body) var(--font-body)',
      color: 'var(--text-body)',
      maxWidth: 'var(--prose-max)',
      marginTop: 14
    }
  }, "Bring the workflow you built in Module 04. You will break it on purpose, then make it recover."))), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(CardHeader, {
    title: "Assignment",
    subtitle: "Due Sunday 23:59 Cairo",
    action: /*#__PURE__*/React.createElement(Badge, {
      tone: "accent",
      dot: true
    }, "Not submitted")
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 12
    }
  }, tasks.map((t, i) => /*#__PURE__*/React.createElement(Checkbox, {
    key: t,
    checked: checks[i],
    onChange: () => toggle(i),
    label: t
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 20,
      paddingTop: 16,
      borderTop: 'var(--rule-hairline)',
      display: 'flex',
      alignItems: 'center',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(Progress, {
    value: doneCount * 25,
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    disabled: doneCount < 4
  }, "Submit for review")))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(CardHeader, {
    title: "Round #1 curriculum",
    subtitle: "4 of 6 modules complete"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column'
    }
  }, LESSON_MODULES.map((m, i) => /*#__PURE__*/React.createElement("div", {
    key: m.n,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '11px 8px',
      borderBottom: i < LESSON_MODULES.length - 1 ? 'var(--rule-hairline)' : 'none',
      background: m.current ? 'var(--surface-sunken)' : 'transparent',
      borderRadius: m.current ? 'var(--radius-sm)' : 0
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--fw-bold) var(--fs-xs)/1 var(--font-mono)',
      color: m.done ? 'var(--text-accent)' : 'var(--text-faint)',
      width: 20
    }
  }, m.n), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      font: (m.current ? 'var(--fw-semibold)' : 'var(--fw-regular)') + ' var(--fs-sm)/1.35 var(--font-body)',
      color: m.done || m.current ? 'var(--text-strong)' : 'var(--text-muted)'
    }
  }, m.t), m.done && /*#__PURE__*/React.createElement(Icon, {
    name: "check",
    size: 15,
    style: {
      color: 'var(--surface-brand)'
    }
  }), m.current && /*#__PURE__*/React.createElement(Badge, {
    tone: "brand",
    size: "sm"
  }, "Now"))))), /*#__PURE__*/React.createElement(Notice, {
    tone: "info",
    title: "Office hours Wednesday",
    icon: /*#__PURE__*/React.createElement(Icon, {
      name: "message-circle",
      size: 16
    }),
    action: /*#__PURE__*/React.createElement(Button, {
      size: "sm",
      variant: "secondary"
    }, "Add question")
  }, "Bring the failing run URL. Abdallah debugs live for 60 minutes."))));
}
Object.assign(window, {
  LessonScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/dashboard/LessonScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/dashboard/LibraryScreen.jsx
try { (() => {
const DS = window.ArabAutomatorsDesignSystem_f5d5e6;
const LIBRARY_SNIPPETS = [{
  title: 'Retry with exponential backoff',
  tags: ['wait', 'error-trigger'],
  by: 'Pixtaha',
  uses: 128
}, {
  title: 'Normalize WhatsApp payload',
  tags: ['set', 'code'],
  by: 'Abdallah Hellal',
  uses: 94
}, {
  title: 'Chunk a Sheets range',
  tags: ['sheets', 'split'],
  by: 'Mariam Adel',
  uses: 61
}, {
  title: 'OpenAI JSON-safe prompt',
  tags: ['openai', 'code'],
  by: 'Pixtaha',
  uses: 57
}, {
  title: 'Supabase upsert by key',
  tags: ['supabase', 'http'],
  by: 'Sara Fouad',
  uses: 33
}, {
  title: 'Telegram alert on failure',
  tags: ['telegram'],
  by: 'Youssef Kamal',
  uses: 28
}];
function LibraryScreen() {
  const {
    Card,
    Button,
    Icon,
    Tag,
    Badge,
    EmptyState,
    Toast,
    Tooltip,
    IconButton
  } = DS;
  const [q, setQ] = React.useState('');
  const [copied, setCopied] = React.useState(null);
  const rows = LIBRARY_SNIPPETS.filter(s => s.title.toLowerCase().includes(q.toLowerCase()));
  const copy = t => {
    setCopied(t);
    setTimeout(() => setCopied(null), 2200);
  };
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(PageHead, {
    title: "Snippet library",
    subtitle: "Node groups the cohort reuses. Copy the JSON straight into your canvas.",
    actions: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(SearchField, {
      value: q,
      onChange: setQ,
      placeholder: "Search snippets\u2026"
    }), /*#__PURE__*/React.createElement(Button, {
      variant: "ink",
      iconStart: /*#__PURE__*/React.createElement(Icon, {
        name: "upload",
        size: 15
      })
    }, "Contribute"))
  }), rows.length === 0 ? /*#__PURE__*/React.createElement(EmptyState, {
    icon: /*#__PURE__*/React.createElement(Icon, {
      name: "search-x",
      size: 20
    }),
    title: "Nothing matches that search",
    action: /*#__PURE__*/React.createElement(Button, {
      size: "sm",
      variant: "secondary",
      onClick: () => setQ('')
    }, "Clear search")
  }, "Try a node name like \"wait\" or \"supabase\".") : /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3,1fr)',
      gap: 16
    }
  }, rows.map(s => /*#__PURE__*/React.createElement(Card, {
    key: s.title,
    interactive: true,
    stripe: s.uses > 90 ? 'accent' : undefined
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0,
      font: 'var(--type-heading)',
      color: 'var(--text-strong)'
    }
  }, s.title), /*#__PURE__*/React.createElement(Tooltip, {
    label: "Copy JSON"
  }, /*#__PURE__*/React.createElement(IconButton, {
    label: "Copy",
    variant: "outline",
    onClick: () => copy(s.title)
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "copy",
    size: 15
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6,
      flexWrap: 'wrap',
      marginTop: 14
    }
  }, s.tags.map(t => /*#__PURE__*/React.createElement(Tag, {
    key: t
  }, t))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 16,
      paddingTop: 12,
      borderTop: 'var(--rule-hairline)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--type-small)',
      color: 'var(--text-muted)'
    }
  }, s.by), /*#__PURE__*/React.createElement(Badge, {
    tone: "neutral",
    size: "sm"
  }, s.uses, " uses"))))), copied && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'fixed',
      bottom: 24,
      right: 24,
      zIndex: 200
    }
  }, /*#__PURE__*/React.createElement(Toast, {
    tone: "ink",
    title: "Snippet JSON copied",
    icon: /*#__PURE__*/React.createElement(Icon, {
      name: "check",
      size: 16
    })
  }, copied)));
}
Object.assign(window, {
  LibraryScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/dashboard/LibraryScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/dashboard/MembersScreen.jsx
try { (() => {
const DS = window.ArabAutomatorsDesignSystem_f5d5e6;
const MEMBER_ROWS = [{
  name: 'Abdallah Hellal',
  role: 'Co-founder',
  city: 'Cairo',
  pct: 100,
  shipped: 12,
  state: 'Instructor'
}, {
  name: 'Mariam Adel',
  role: 'Member',
  city: 'Alexandria',
  pct: 83,
  shipped: 5,
  state: 'Active'
}, {
  name: 'Youssef Kamal',
  role: 'Member',
  city: 'Giza',
  pct: 67,
  shipped: 3,
  state: 'Active'
}, {
  name: 'Sara Fouad',
  role: 'Member',
  city: 'Riyadh',
  pct: 50,
  shipped: 2,
  state: 'Active'
}, {
  name: 'Omar Nabil',
  role: 'Member',
  city: 'Amman',
  pct: 33,
  shipped: 1,
  state: 'At risk'
}, {
  name: 'Layla Hassan',
  role: 'Member',
  city: 'Casablanca',
  pct: 17,
  shipped: 0,
  state: 'At risk'
}];
function MembersScreen() {
  const {
    Card,
    Avatar,
    Badge,
    Progress,
    Button,
    Icon,
    Tabs,
    StatCard
  } = DS;
  const [tab, setTab] = React.useState('all');
  const tone = {
    Instructor: 'ink',
    Active: 'brand',
    'At risk': 'accent'
  };
  const rows = MEMBER_ROWS.filter(m => tab === 'all' || tab === 'risk' && m.state === 'At risk');
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(PageHead, {
    title: "Members",
    subtitle: "Round #1 cohort \u2014 progress and shipped work.",
    actions: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(SearchField, {
      value: "",
      onChange: () => {},
      placeholder: "Search members\u2026"
    }), /*#__PURE__*/React.createElement(Button, {
      variant: "secondary",
      iconStart: /*#__PURE__*/React.createElement(Icon, {
        name: "mail",
        size: 15
      })
    }, "Message cohort"), /*#__PURE__*/React.createElement(Button, {
      variant: "ink",
      iconStart: /*#__PURE__*/React.createElement(Icon, {
        name: "user-plus",
        size: 15
      })
    }, "Invite")),
    tabs: /*#__PURE__*/React.createElement(Tabs, {
      value: tab,
      onChange: setTab,
      tabs: [{
        value: 'all',
        label: 'All members',
        count: 342
      }, {
        value: 'risk',
        label: 'At risk',
        count: 41
      }]
    })
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3,1fr)',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(StatCard, {
    eyebrow: "Enrolled",
    value: "342",
    footnote: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", null, "86% of seats"), /*#__PURE__*/React.createElement("span", null, "58 left")),
    progress: 86
  })), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(StatCard, {
    eyebrow: "Completed 4+ modules",
    value: "222",
    delta: "65%",
    footnote: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", null, "target 80%"), /*#__PURE__*/React.createElement("span", null, "Wk 6")),
    progress: 65
  })), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(StatCard, {
    eyebrow: "At risk",
    value: "41",
    delta: "\u22126",
    footnote: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", null, "no activity 14d"), /*#__PURE__*/React.createElement("span", null, "12%")),
    progress: 12
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3,1fr)',
      gap: 16
    }
  }, rows.map(m => /*#__PURE__*/React.createElement(Card, {
    key: m.name,
    interactive: true
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: m.name,
    size: "lg",
    tone: m.state === 'Instructor' ? 'ink' : 'brand'
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--fw-bold) var(--fs-md)/1.25 var(--font-display)',
      color: 'var(--text-strong)'
    }
  }, m.name), /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--type-small)',
      color: 'var(--text-muted)'
    }
  }, m.role, " \xB7 ", m.city)), /*#__PURE__*/React.createElement(Badge, {
    tone: tone[m.state],
    dot: true,
    size: "sm"
  }, m.state)), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 18
    }
  }, /*#__PURE__*/React.createElement(Progress, {
    value: m.pct,
    label: "Curriculum",
    hint: m.pct + '%'
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      marginTop: 14,
      paddingTop: 12,
      borderTop: 'var(--rule-hairline)',
      font: 'var(--type-small)',
      color: 'var(--text-muted)'
    }
  }, /*#__PURE__*/React.createElement("span", null, "Workflows shipped"), /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--fw-semibold) var(--fs-sm)/1 var(--font-mono)',
      color: 'var(--text-strong)'
    }
  }, m.shipped))))));
}
Object.assign(window, {
  MembersScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/dashboard/MembersScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/dashboard/OverviewScreen.jsx
try { (() => {
const DS = window.ArabAutomatorsDesignSystem_f5d5e6;
const OVERVIEW_RUNS = [{
  label: 'Wk 1',
  value: 180
}, {
  label: 'Wk 2',
  value: 342
}, {
  label: 'Wk 3',
  value: 291
}, {
  label: 'Wk 4',
  value: 508
}, {
  label: 'Wk 5',
  value: 446
}, {
  label: 'Wk 6',
  value: 612
}];
const OVERVIEW_ACTIVITY = [{
  icon: 'webhook',
  title: 'Lead intake webhook',
  sub: 'Abdallah Hellal',
  meta: 'Today, 10:24',
  value: '+42 runs',
  tone: 'positive'
}, {
  icon: 'message-square',
  title: 'WhatsApp to Telegram normalizer',
  sub: 'Pixtaha',
  meta: 'Today, 08:02',
  value: '+18 runs',
  tone: 'positive'
}, {
  icon: 'file-spreadsheet',
  title: 'Invoice OCR to Sheets',
  sub: 'Mariam Adel',
  meta: 'Yesterday',
  value: '3 failed',
  tone: 'default'
}, {
  icon: 'bell',
  title: 'Attendance reminder',
  sub: 'Youssef Kamal',
  meta: 'Oct 12',
  value: '+7 runs',
  tone: 'positive'
}, {
  icon: 'database',
  title: 'Supabase backup',
  sub: 'Pixtaha',
  meta: 'Oct 11',
  value: '+1 run',
  tone: 'muted'
}];
function OverviewScreen({
  onOpenModal
}) {
  const {
    Card,
    CardHeader,
    StatCard,
    GoalRow,
    BarChart,
    ListRow,
    Notice,
    Button,
    Badge,
    Icon,
    IconButton,
    Tabs
  } = DS;
  const [range, setRange] = React.useState('Round');
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(PageHead, {
    eyebrow: "Round #1 \xB7 Week 6 of 6",
    title: "Good evening, Pixtaha",
    subtitle: "342 members enrolled. 128 workflows shipped so far.",
    actions: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(SearchField, {
      value: "",
      onChange: () => {},
      placeholder: "Search workflows, members\u2026"
    }), /*#__PURE__*/React.createElement(Button, {
      variant: "secondary",
      iconStart: /*#__PURE__*/React.createElement(Icon, {
        name: "download",
        size: 15
      })
    }, "Export"), /*#__PURE__*/React.createElement(Button, {
      variant: "ink",
      iconStart: /*#__PURE__*/React.createElement(Icon, {
        name: "plus",
        size: 15
      }),
      onClick: onOpenModal
    }, "New announcement"))
  }), /*#__PURE__*/React.createElement(Notice, {
    tone: "warning",
    title: "Round #2 applications open 12 September",
    icon: /*#__PURE__*/React.createElement(Icon, {
      name: "alert-triangle",
      size: 16
    }),
    action: /*#__PURE__*/React.createElement(Button, {
      size: "sm",
      variant: "secondary"
    }, "Review waitlist")
  }, "184 people on the waitlist. Seats cap at 400."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4,1fr)',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(StatCard, {
    eyebrow: "Active members",
    value: "342",
    delta: "+18",
    footnote: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", null, "of 400 seats"), /*#__PURE__*/React.createElement("span", null, "86%")),
    progress: 86
  })), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(StatCard, {
    eyebrow: "Workflows shipped",
    value: "128",
    delta: "+12%",
    footnote: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", null, "this round"), /*#__PURE__*/React.createElement("span", null, "21 live")),
    progress: 64
  })), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(StatCard, {
    eyebrow: "Runs this week",
    value: "1,284",
    delta: "+37%",
    footnote: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", null, "612 on Wk 6"), /*#__PURE__*/React.createElement("span", null, "3 failed")),
    progress: 72
  })), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(StatCard, {
    eyebrow: "Curriculum done",
    value: "65%",
    delta: "+9pt",
    footnote: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", null, "4 of 6 modules"), /*#__PURE__*/React.createElement("span", null, "222 members")),
    progress: 65
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1.35fr 1fr',
      gap: 16,
      alignItems: 'start'
    }
  }, /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(CardHeader, {
    title: "Workflow runs",
    subtitle: "Executions across all member workspaces",
    action: /*#__PURE__*/React.createElement(Tabs, {
      variant: "segmented",
      tabs: ['Week', 'Round'],
      value: range,
      onChange: setRange
    })
  }), /*#__PURE__*/React.createElement(BarChart, {
    height: 190,
    data: OVERVIEW_RUNS,
    valueFormat: v => v.toLocaleString() + ' runs'
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 24,
      marginTop: 20,
      paddingTop: 16,
      borderTop: 'var(--rule-hairline)'
    }
  }, [['Total', '2,379'], ['Median / member', '7'], ['Failure rate', '0.4%']].map(([k, v]) => /*#__PURE__*/React.createElement("div", {
    key: k
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--type-eyebrow)',
      letterSpacing: 'var(--tr-widest)',
      textTransform: 'uppercase',
      color: 'var(--text-muted)'
    }
  }, k), /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--fw-bold) var(--fs-xl)/1.1 var(--font-display)',
      color: 'var(--text-strong)',
      marginTop: 4
    }
  }, v))))), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(CardHeader, {
    title: "Cohort targets",
    subtitle: "Module completion, Round #1",
    action: /*#__PURE__*/React.createElement(Button, {
      variant: "secondary",
      pill: true,
      size: "sm"
    }, "New goal")
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(GoalRow, {
    label: "Module 4 \u2014 HTTP and APIs",
    target: "291 learners",
    pct: 85,
    note: "248 done"
  }), /*#__PURE__*/React.createElement(GoalRow, {
    label: "Module 5 \u2014 Error handling",
    target: "291 learners",
    pct: 41,
    note: "119 done"
  })), /*#__PURE__*/React.createElement("p", {
    style: {
      font: 'var(--type-small)',
      color: 'var(--text-muted)',
      marginTop: 14
    }
  }, "Module 6 unlocks when Module 5 passes 60%."))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1.35fr 1fr',
      gap: 16,
      alignItems: 'start'
    }
  }, /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(CardHeader, {
    title: "Recent activity",
    subtitle: "Latest published workflows across the community",
    action: /*#__PURE__*/React.createElement(Button, {
      variant: "secondary",
      pill: true,
      size: "sm"
    }, "View all")
  }), OVERVIEW_ACTIVITY.map((a, i) => /*#__PURE__*/React.createElement(ListRow, {
    key: a.title,
    icon: /*#__PURE__*/React.createElement(Icon, {
      name: a.icon,
      size: 16
    }),
    title: a.title,
    subtitle: a.sub,
    meta: a.meta,
    value: a.value,
    valueTone: a.tone,
    divider: i < OVERVIEW_ACTIVITY.length - 1,
    trailing: /*#__PURE__*/React.createElement(IconButton, {
      label: "More"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "more-horizontal",
      size: 15
    }))
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement(Card, {
    dots: true
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--type-eyebrow)',
      letterSpacing: 'var(--tr-widest)',
      textTransform: 'uppercase',
      color: 'var(--text-muted)'
    }
  }, "Next live session"), /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--fw-bold) var(--fs-2xl)/1.15 var(--font-display)',
      letterSpacing: 'var(--tr-tighter)',
      color: 'var(--text-strong)',
      marginTop: 6
    }
  }, "Error handling and retries"), /*#__PURE__*/React.createElement("p", {
    style: {
      font: 'var(--type-small)',
      color: 'var(--text-muted)',
      marginTop: 6
    }
  }, "Thursday 21:00 Cairo \xB7 90 minutes \xB7 Abdallah Hellal"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      marginTop: 16
    }
  }, /*#__PURE__*/React.createElement(Button, {
    size: "sm"
  }, "Join room"), /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    variant: "secondary"
  }, "Add to calendar"))), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(CardHeader, {
    title: "Your queue",
    subtitle: "3 items need review"
  }), [['Invoice OCR — Mariam Adel', 'Submitted 2h ago'], ['Slack digest — Omar Nabil', 'Submitted 5h ago'], ['Retry wrapper — Sara Fouad', 'Yesterday']].map(([t, s], i) => /*#__PURE__*/React.createElement(ListRow, {
    key: t,
    title: t,
    subtitle: s,
    divider: i < 2,
    trailing: /*#__PURE__*/React.createElement(Badge, {
      tone: "accent",
      dot: true,
      size: "sm"
    }, "Pending"),
    onClick: () => {}
  }))))));
}
Object.assign(window, {
  OverviewScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/dashboard/OverviewScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/dashboard/WorkflowsScreen.jsx
try { (() => {
const DS = window.ArabAutomatorsDesignSystem_f5d5e6;
const WORKFLOW_ROWS = [{
  id: 1,
  name: 'Lead intake webhook',
  owner: 'Abdallah Hellal',
  nodes: 14,
  runs: '1,204',
  last: 'Today, 10:24',
  state: 'Live'
}, {
  id: 2,
  name: 'WhatsApp to Telegram normalizer',
  owner: 'Pixtaha',
  nodes: 9,
  runs: '842',
  last: 'Today, 08:02',
  state: 'Live'
}, {
  id: 3,
  name: 'Invoice OCR to Sheets',
  owner: 'Mariam Adel',
  nodes: 22,
  runs: '318',
  last: 'Yesterday',
  state: 'Failing'
}, {
  id: 4,
  name: 'Attendance reminder',
  owner: 'Youssef Kamal',
  nodes: 6,
  runs: '211',
  last: 'Oct 12',
  state: 'Live'
}, {
  id: 5,
  name: 'Supabase nightly backup',
  owner: 'Pixtaha',
  nodes: 4,
  runs: '96',
  last: 'Oct 11',
  state: 'Paused'
}, {
  id: 6,
  name: 'Notion to Sheets sync',
  owner: 'Sara Fouad',
  nodes: 11,
  runs: '12',
  last: 'Oct 09',
  state: 'Draft'
}];
const WORKFLOW_TAGS = ['All', 'n8n', 'webhook', 'http', 'openai', 'supabase'];
function WorkflowsScreen() {
  const {
    Card,
    DataTable,
    Badge,
    Button,
    Icon,
    Tag,
    Tabs,
    EmptyState,
    IconButton,
    Tooltip
  } = DS;
  const [tag, setTag] = React.useState('All');
  const [tab, setTab] = React.useState('all');
  const [q, setQ] = React.useState('');
  const tone = {
    Live: 'brand',
    Failing: 'danger',
    Paused: 'accent',
    Draft: 'outline'
  };
  const rows = WORKFLOW_ROWS.filter(r => (tab === 'all' || tab === 'live' && r.state === 'Live' || tab === 'drafts' && r.state === 'Draft') && r.name.toLowerCase().includes(q.toLowerCase()));
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(PageHead, {
    title: "Workflows",
    subtitle: "Every automation published by Round #1 members.",
    actions: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(SearchField, {
      value: q,
      onChange: setQ,
      placeholder: "Search workflows\u2026"
    }), /*#__PURE__*/React.createElement(Button, {
      variant: "ink",
      iconStart: /*#__PURE__*/React.createElement(Icon, {
        name: "plus",
        size: 15
      })
    }, "New workflow")),
    tabs: /*#__PURE__*/React.createElement(Tabs, {
      value: tab,
      onChange: setTab,
      tabs: [{
        value: 'all',
        label: 'All',
        count: WORKFLOW_ROWS.length
      }, {
        value: 'live',
        label: 'Live',
        count: 3
      }, {
        value: 'drafts',
        label: 'Drafts',
        count: 1
      }]
    })
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      flexWrap: 'wrap'
    }
  }, WORKFLOW_TAGS.map(t => /*#__PURE__*/React.createElement(Tag, {
    key: t,
    active: t === tag,
    onClick: () => setTag(t)
  }, t))), /*#__PURE__*/React.createElement(Card, {
    padding: "sm"
  }, rows.length === 0 ? /*#__PURE__*/React.createElement(EmptyState, {
    compact: true,
    icon: /*#__PURE__*/React.createElement(Icon, {
      name: "search-x",
      size: 20
    }),
    title: "No workflows match",
    dots: false
  }, "Try a different search or clear the filter.") : /*#__PURE__*/React.createElement(DataTable, {
    onRowClick: () => {},
    columns: [{
      key: 'name',
      label: 'Workflow',
      strong: true
    }, {
      key: 'owner',
      label: 'Owner'
    }, {
      key: 'nodes',
      label: 'Nodes',
      mono: true,
      align: 'end',
      width: 90
    }, {
      key: 'runs',
      label: 'Runs',
      mono: true,
      align: 'end',
      width: 90
    }, {
      key: 'last',
      label: 'Last run',
      align: 'end',
      width: 130
    }, {
      key: 'state',
      label: 'State',
      align: 'end',
      width: 110,
      render: r => /*#__PURE__*/React.createElement(Badge, {
        tone: tone[r.state],
        dot: true,
        size: "sm"
      }, r.state)
    }, {
      key: 'act',
      label: '',
      align: 'end',
      width: 48,
      render: () => /*#__PURE__*/React.createElement(Tooltip, {
        label: "Open in n8n"
      }, /*#__PURE__*/React.createElement(IconButton, {
        label: "Open"
      }, /*#__PURE__*/React.createElement(Icon, {
        name: "arrow-up-right",
        size: 15
      })))
    }],
    rows: rows
  })));
}
Object.assign(window, {
  WorkflowsScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/dashboard/WorkflowsScreen.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Avatar = __ds_scope.Avatar;

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.CardHeader = __ds_scope.CardHeader;

__ds_ns.Icon = __ds_scope.Icon;

__ds_ns.IconButton = __ds_scope.IconButton;

__ds_ns.Progress = __ds_scope.Progress;

__ds_ns.StatCard = __ds_scope.StatCard;

__ds_ns.Tag = __ds_scope.Tag;

__ds_ns.BarChart = __ds_scope.BarChart;

__ds_ns.DataTable = __ds_scope.DataTable;

__ds_ns.GoalRow = __ds_scope.GoalRow;

__ds_ns.ListRow = __ds_scope.ListRow;

__ds_ns.EmptyState = __ds_scope.EmptyState;

__ds_ns.Modal = __ds_scope.Modal;

__ds_ns.Notice = __ds_scope.Notice;

__ds_ns.Skeleton = __ds_scope.Skeleton;

__ds_ns.Toast = __ds_scope.Toast;

__ds_ns.Tooltip = __ds_scope.Tooltip;

__ds_ns.Checkbox = __ds_scope.Checkbox;

__ds_ns.Field = __ds_scope.Field;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.RadioGroup = __ds_scope.RadioGroup;

__ds_ns.Select = __ds_scope.Select;

__ds_ns.Slider = __ds_scope.Slider;

__ds_ns.Switch = __ds_scope.Switch;

__ds_ns.Textarea = __ds_scope.Textarea;

__ds_ns.Breadcrumb = __ds_scope.Breadcrumb;

__ds_ns.Sidebar = __ds_scope.Sidebar;

__ds_ns.Tabs = __ds_scope.Tabs;

__ds_ns.TopBar = __ds_scope.TopBar;

__ds_ns.Wordmark = __ds_scope.Wordmark;

__ds_ns.DotField = __ds_scope.DotField;

__ds_ns.SectionHeading = __ds_scope.SectionHeading;

})();
