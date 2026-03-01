import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import * as React from 'react';

describe('Accordion Component Interaction', () => {
  it('renders and toggles correctly', () => {
    render(
      <Accordion type="single" collapsible defaultValue="item-1">
        <AccordionItem value="item-1">
          <AccordionTrigger>Toggle Item 1</AccordionTrigger>
          <AccordionContent>Hidden Content 1</AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2">
          <AccordionTrigger>Toggle Item 2</AccordionTrigger>
          <AccordionContent>Hidden Content 2</AccordionContent>
        </AccordionItem>
      </Accordion>
    );

    const trigger1 = screen.getByText('Toggle Item 1');
    const trigger2 = screen.getByText('Toggle Item 2');

    expect(trigger1).toBeInTheDocument();
    expect(trigger1).toHaveAttribute('data-state', 'open');
    expect(trigger2).toHaveAttribute('data-state', 'closed');

    // Click to collapse
    fireEvent.click(trigger1);
    expect(trigger1).toHaveAttribute('data-state', 'closed');

    // Click to open item 2
    fireEvent.click(trigger2);
    expect(trigger2).toHaveAttribute('data-state', 'open');
  });
});
