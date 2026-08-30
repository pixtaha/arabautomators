import { CourseTocList } from "@/components/home/CourseTocList";
import { getModules } from "@/lib/data/modules";

export async function CourseToc() {
  const modules = await getModules();

  return (
    <section
      id="course"
      className="mx-auto max-w-[1180px] scroll-mt-20 px-4 py-12 sm:px-6 sm:py-16 md:py-[72px]"
    >
      <CourseTocList modules={modules} />
    </section>
  );
}
