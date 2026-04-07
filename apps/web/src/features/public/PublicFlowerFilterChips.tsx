import Link from 'next/link';

type FilterItem = { label: string; value: string };

type PublicFlowerFilterChipsProps = {
  filters: FilterItem[];
  selected: string | null;
  basePath: '/' | '/map';
};

export function PublicFlowerFilterChips({ filters, selected, basePath }: PublicFlowerFilterChipsProps) {
  const all = [{ label: '전체', value: null }, ...filters];

  return (
    <div className="overflow-x-auto">
      <div className="flex min-w-max gap-2 px-4 py-3 md:px-0">
        {all.map((filter) => {
          const isActive = filter.value === selected;
          const href = filter.value ? `${basePath}?flower=${encodeURIComponent(filter.value)}` : basePath;

          return (
            <Link
              key={filter.value ?? '__all'}
              href={href}
              className={
                isActive
                  ? 'rounded-full bg-[#C45C7E] px-4 py-2 text-sm font-semibold text-white'
                  : 'rounded-full border border-[#E9D7DE] bg-white px-4 py-2 text-sm font-semibold text-[#8B5A6E]'
              }
            >
              {filter.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
