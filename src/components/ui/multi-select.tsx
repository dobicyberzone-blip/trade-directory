'use client';

import * as React from 'react';
import { Check, X, ChevronsUpDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export interface MultiSelectOption {
  value: string;
  label: string;
  region?: string;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = 'Select items...',
  className,
  disabled = false,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState('');

  const handleSelect = (value: string) => {

    const isCurrentlySelected = selected.includes(value);

    const newSelected = isCurrentlySelected
      ? selected.filter((item) => item !== value)
      : [...selected, value];

    onChange(newSelected);
  };

  const handleRemove = (value: string, e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    onChange(selected.filter((item) => item !== value));
  };

  const selectedLabels = selected
    .map((value) => options.find((opt) => opt.value === value)?.label)
    .filter(Boolean);

  // Group options by region if available
  const groupedOptions = React.useMemo(() => {
    const groups: Record<string, MultiSelectOption[]> = {};
    
    options.forEach((option) => {
      const region = option.region || 'Other';
      if (!groups[region]) {
        groups[region] = [];
      }
      groups[region].push(option);
    });
    
    return groups;
  }, [options]);

  // Filter options based on search
  const filteredGroups = React.useMemo(() => {
    if (!searchValue) return groupedOptions;
    
    const filtered: Record<string, MultiSelectOption[]> = {};
    Object.entries(groupedOptions).forEach(([region, regionOptions]) => {
      const matchingOptions = regionOptions.filter((option) =>
        option.label.toLowerCase().includes(searchValue.toLowerCase())
      );
      if (matchingOptions.length > 0) {
        filtered[region] = matchingOptions;
      }
    });
    
    return filtered;
  }, [groupedOptions, searchValue]);

  return (
    <div className={cn('w-full', className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={disabled}
          >
            <span className="truncate">
              {selected.length === 0
                ? placeholder
                : `${selected.length} selected`}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="p-0" 
          align="start"
          style={{ width: 'var(--radix-popover-trigger-width)' }}
        >
          <Command shouldFilter={false}>
            <CommandInput 
              placeholder="Search..." 
              value={searchValue}
              onValueChange={setSearchValue}
            />
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandList className="max-h-64">
              {Object.entries(filteredGroups).map(([region, regionOptions]) => (
                <CommandGroup key={region} heading={region}>
                  {regionOptions.map((option) => {
                    const isSelected = selected.includes(option.value);
                    return (
                      <CommandItem
                        key={option.value}
                        value={option.value}
                        onSelect={(currentValue) => {

                          // Use the option.value directly instead of currentValue
                          handleSelect(option.value);
                        }}
                        onClick={(e) => {

                          e.preventDefault();
                          e.stopPropagation();
                          handleSelect(option.value);
                        }}
                        className="cursor-pointer"
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            isSelected ? 'opacity-100' : 'opacity-0'
                          )}
                        />
                        {option.label}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Selected items */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {selected.map((value) => {
            const option = options.find(opt => opt.value === value);
            return (
              <Badge
                key={value}
                variant="secondary"
                className="pl-2 pr-1"
              >
                {option?.label || value}
                <button
                  type="button"
                  className="ml-1 rounded-full hover:bg-gray-300 p-0.5"
                  onClick={(e) => handleRemove(value, e)}
                  disabled={disabled}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
}