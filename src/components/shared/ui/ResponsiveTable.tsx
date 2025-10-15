import React from 'react';

interface ResponsiveTableProps {
  children: React.ReactNode;
  className?: string;
  showScrollIndicator?: boolean;
}

/**
 * ResponsiveTable Component
 *
 * Wraps tables to make them horizontally scrollable on mobile devices.
 * Prevents table overflow and ensures proper mobile UX.
 *
 * @example
 * <ResponsiveTable>
 *   <Table>
 *     <TableHeader>...</TableHeader>
 *     <TableBody>...</TableBody>
 *   </Table>
 * </ResponsiveTable>
 */
export const ResponsiveTable: React.FC<ResponsiveTableProps> = ({
  children,
  className = '',
  showScrollIndicator = false
}) => {
  return (
    <div
      className={`
        overflow-x-auto
        -mx-4 sm:mx-0
        relative
        touch-scroll
        ${showScrollIndicator ? 'scroll-indicator' : ''}
        ${className}
      `}
    >
      <div className="inline-block min-w-full align-middle">
        <div className="overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
};

export default ResponsiveTable;
