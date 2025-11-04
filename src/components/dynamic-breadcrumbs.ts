interface PageSubGroupItem {
  name: string;
  parentName: string;
  parentLink: string;
}

export function generateBreadcrumbGroupParent() {
  const ITEM_ATTR = 'data-page-group';
  const ITEM_TYPE_ATTR = 'data-page-group-type';
  const ITEM_PARENT_ATTR = 'data-page-group-parent';
  const ITEM_PARENT_LINK_ATTR = 'data-page-group-parent-link';

  const pageSubGroupList: PageSubGroupItem[] = [];

  const pageGroupItems = document.querySelectorAll(`[${ITEM_ATTR}]`);
  pageGroupItems.forEach((item) => {
    const itemName = item.getAttribute(ITEM_ATTR) as string;
    const itemType = item.getAttribute(ITEM_TYPE_ATTR);
    const parentName = item.getAttribute(ITEM_PARENT_ATTR) as string;
    const parentLink = item.getAttribute(ITEM_PARENT_LINK_ATTR) as string;

    console.debug({ itemName, itemType, parentName, parentLink });

    if (itemType !== 'Sub-Group' || parentName === '') {
      return;
    }

    pageSubGroupList.push({
      name: itemName,
      parentName: parentName,
      parentLink: parentLink,
    });
  });

  console.debug({ pageSubGroupList });

  const BREADCRUMB_SELECTOR = '[data-breadcrumb="group-parent"]';
  const BREADCRUMB_SUB_GROUP_NAME = 'data-breadcrumb-sub-group-name';
  const BREADCRUMB_PARENT_NAME_SELECTOR = '[data-breadcrumb-parent-name]';

  const breadcrumbEl = document.querySelector(BREADCRUMB_SELECTOR);

  if (!breadcrumbEl || window.getComputedStyle(breadcrumbEl).display === 'none') {
    return;
  }

  const subGroupName = breadcrumbEl.getAttribute(BREADCRUMB_SUB_GROUP_NAME);
  const parentInfo = pageSubGroupList.find((item) => item.name === subGroupName);

  if (!parentInfo) {
    console.error('[Dynamic Breadcrumbs] Parent name not found for sub-group:', subGroupName);
    return;
  }

  breadcrumbEl.setAttribute('href', parentInfo.parentLink);

  const breadcrumbTextEl = breadcrumbEl.querySelector(BREADCRUMB_PARENT_NAME_SELECTOR);
  if (breadcrumbTextEl) {
    breadcrumbTextEl.textContent = parentInfo.parentName;
  }
}
