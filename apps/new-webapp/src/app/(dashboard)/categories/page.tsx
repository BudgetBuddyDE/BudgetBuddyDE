import type {Metadata} from 'next';
import {EntityWorkspace} from '@/components/entity-workspace';

export const metadata: Metadata = {title: 'Categories'};
export default function CategoriesPage() {
  return <EntityWorkspace kind="categories" />;
}
