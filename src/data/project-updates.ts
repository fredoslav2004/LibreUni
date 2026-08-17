export type ProjectUpdate = {
  date: string;
  label: "Announcement" | "Update";
  title: string;
  paragraphs: readonly string[];
};

/**
 * Manual messages for the LibreUni community. Write these as plain-language
 * updates about the direction and state of the project.
 */
export const projectUpdates: readonly ProjectUpdate[] = [
  {
    date: "2026-08-17",
    label: "Announcement",
    title: "A sharper direction for LibreUni",
    paragraphs: [
      "LibreUni started not only with a vision and mission about accessibility, openness, transparency, freedom, and other often mentioned qualities. It has always also been about the quality of the materials, being able to actually provide university level education.",
      "LibreUni is developed in many ways, it is a dance between understanding learning needs, getting materials, developing the courses, getting relevant reviewers, getting user feedback and all of it again in a cycle. ",
      "In order to test out the prototype of this idea, many courses have been created. Some because of the pure need for such courses and some to test out new features, to create more directions people could take, to confirm we are aiming for a large library of courses.",
      "This does not make sense anymore. The decision of deleting courses has been hidden or rather suppressed by the new drafting/tagging system for the courses and having many marked as hidden. This does not make sense along having Git and providing the ability to self-host.",
      "Many courses will be deleted. Many courses and functionalities of the website will be changed. New approaches to development will be taken. We fully encourage and support anyone that still needs the older content to take it, fork it, or do anything else with it. But this platform will not thrive without this done.",
      "- Eduard Fekete",
    ],
  },
];
