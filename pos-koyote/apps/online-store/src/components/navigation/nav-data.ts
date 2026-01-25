export type MenuLinkConfig = {
  labelKey: string;
  href: string;
  descriptionKey?: string;
};

export type MenuSectionConfig = {
  titleKey: string;
  items: MenuLinkConfig[];
};

export type MegaMenuConfig = {
  sections: MenuSectionConfig[];
};

export type DropdownConfig = {
  items: MenuLinkConfig[];
};

export type NavItemConfig = {
  id: string;
  labelKey: string;
  type: "mega" | "dropdown";
  href?: string;
  panel?: MegaMenuConfig | DropdownConfig;
};

const productsSection: MenuSectionConfig = {
  titleKey: "navigation.sections.products",
  items: [
    { labelKey: "navigation.links.sealed", href: "/catalog" },
    { labelKey: "navigation.links.singles", href: "/catalog" },
    { labelKey: "navigation.links.accessories", href: "/catalog" }
  ]
};

const specialSection: MenuSectionConfig = {
  titleKey: "navigation.sections.special",
  items: [
    { labelKey: "navigation.links.newReleases", href: "/catalog" },
    { labelKey: "navigation.links.preorders", href: "/preorders" },
    { labelKey: "navigation.links.bestSellers", href: "/catalog" }
  ]
};

const expansionsSection: MenuSectionConfig = {
  titleKey: "navigation.sections.expansions",
  items: [
    { labelKey: "navigation.expansions.item1", href: "/catalog" },
    { labelKey: "navigation.expansions.item2", href: "/catalog" },
    { labelKey: "navigation.expansions.item3", href: "/catalog" },
    { labelKey: "navigation.links.viewAllSets", href: "/catalog" }
  ]
};

export const megaMenuConfig: MegaMenuConfig = {
  sections: [productsSection, specialSection, expansionsSection]
};

export const navItems: NavItemConfig[] = [
  { id: "pokemon", labelKey: "navigation.items.pokemon", type: "mega", panel: megaMenuConfig },
  { id: "one-piece", labelKey: "navigation.items.onePiece", type: "mega", panel: megaMenuConfig },
  { id: "yugioh", labelKey: "navigation.items.yugioh", type: "mega", panel: megaMenuConfig },
  {
    id: "others",
    labelKey: "navigation.items.others",
    type: "dropdown",
    panel: {
      items: [
        { labelKey: "navigation.others.digimon", href: "/catalog" },
        { labelKey: "navigation.others.magic", href: "/catalog" },
        { labelKey: "navigation.others.gundam", href: "/catalog" },
        { labelKey: "navigation.others.more", href: "/catalog" }
      ]
    }
  }
];

export const secondaryLinks: MenuLinkConfig[] = [
  { labelKey: "navigation.items.preorders", href: "/preorders" },
  { labelKey: "navigation.items.community", href: "/community" }
];
