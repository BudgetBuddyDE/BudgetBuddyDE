'use client';

import {Card as MantineCard, Group, Text, Title, createPolymorphicComponent} from '@mantine/core';
import type {
  CardProps as MantineCardProps,
  CardSectionProps as MantineCardSectionProps,
  GroupProps,
  PolymorphicComponentProps,
  TextProps,
  TitleProps,
} from '@mantine/core';
import {Children, cloneElement, isValidElement} from 'react';
import classes from './Card.module.css';

export type CardProps = MantineCardProps;
export type CardSectionProps = MantineCardSectionProps;
export type CardHeaderProps = CardSectionProps;
export type CardBodyProps = CardSectionProps;
export type CardFooterProps = CardSectionProps;
export type CardHeaderActionsProps = GroupProps;
export type CardTitleProps = TitleProps;
export type CardSubtitleProps = TextProps;

type SectionProps = PolymorphicComponentProps<'div', CardSectionProps>;

function renderSection(props: SectionProps, className?: string) {
  return (
    <MantineCard.Section
      inheritPadding
      {...props}
      className={[classes.section, className, props.className].filter(Boolean).join(' ')}
    />
  );
}

const Header = createPolymorphicComponent<'div', CardHeaderProps>(function CardHeader(props: SectionProps) {
  return renderSection(props, classes.header);
});

const Body = createPolymorphicComponent<'div', CardBodyProps>(function CardBody(props: SectionProps) {
  return renderSection(props);
});

const Footer = createPolymorphicComponent<'div', CardFooterProps>(function CardFooter(props: SectionProps) {
  return renderSection(props, classes.footer);
});

const HeaderActions = Group.withProps({gap: 'xs', wrap: 'nowrap'});
const CardTitle = Title.withProps({order: 3, size: 'md'});
const Subtitle = Text.withProps({size: 'sm', c: 'dimmed'});

/**
 * Optional Header, Body, Footer and Section components must be direct children,
 * just like Mantine Card.Section. Other children are rendered unchanged.
 */
export const Card = Object.assign(
  createPolymorphicComponent<'div', CardProps>(function CardRoot({
    children,
    ...props
  }: PolymorphicComponentProps<'div', CardProps>) {
    const content = Children.toArray(children).map(child => {
      if (!isValidElement<SectionProps>(child)) return child;

      // Mantine recognizes its own Section elements before rendering their content.
      // Convert our named sections first so orientation and edge spacing are preserved.
      if (child.type === Header) return cloneElement(renderSection(child.props, classes.header), {key: child.key});
      if (child.type === Body) return cloneElement(renderSection(child.props), {key: child.key});
      if (child.type === Footer) return cloneElement(renderSection(child.props, classes.footer), {key: child.key});

      return child;
    });

    return <MantineCard {...props}>{content}</MantineCard>;
  }),
  {
    Header,
    Body,
    Footer,
    HeaderActions,
    Title: CardTitle,
    Subtitle,
    Section: MantineCard.Section,
  },
);
