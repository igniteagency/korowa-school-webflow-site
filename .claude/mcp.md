When working with the Webflow project use MCP tool to take actions on the "Korowa Anglical Girls School" site.

# Rules

- Before making any destructive actions like deleting CMS, fields, or structure, or components, always confirm first.

- Designs are to be obtained from the Figma file using the Figma MCP connector, defaulting to the current selected page/frame. If the current selection doesn't match the prompt, confirm with details of selected frame before proceeding.

# Building a new page in Webflow from Figma

## Step 1: Identifying and adding components

1a. Fetch all Figma "Components" within the currently selected Frame. Make a list of all them in order. Skip Navbar and Footer components.

1b. Switch to Webflow MCP – 

1c. Refer to the "All Components" page to match the component names from Figma. Note how the components are used (along with any nested components). Many components require nested sub-components with content in them. Always add all the relevant subcomponents too on the page to complete a structure.

1d. If asked for a new page, duplicate a new page from the "Page Structure Template" page (use Webflow duplicate feature; don't build it from scratch). It has the base for a new page, already having the nav and footer built in the page. So ignore those from the design file. All the page content component should go within the `.main-wrapper` div.

1e. Following the order of components from Figma page, add them one by one in Webflow, along with all the nested components as a part of the section structure. Skip the Navbar and Footer components as they already exist when a page is cloned from the Page Structure template.

## Step 2 - Updating content for each component 1 by 1:

2a. Now, go through each component frame in Figma and scan all the text content in there.

2b. For each component one by one, switch to Webflow Designer MCP, and update the respective component properties with the same text content as Figma. Use the "Components update properties" Webflow MCP tool for updating content.

**Important - never add any direct HTML webflow elements or edit any components. Only build using existing components, and add content using component properties. Confirm when unsure about a particular section.**