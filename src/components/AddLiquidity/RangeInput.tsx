import React, { useState, useEffect, useMemo, useRef } from 'react';
import { HederaToken } from '../../utils/tokens';
import { formatInput } from '../../utils/numbers';
import TokenLabel from '../TokenLabel';

// Constants for tick math
const MIN_TICK = -887272;
const MAX_TICK = 887272;

// Helper function to convert tick to price
const tickToPrice = (tick: number): number => {
  return Math.pow(1.0001, tick);
};

// Helper function to convert price to tick
const priceToTick = (price: number): number => {
  return Math.log(price) / Math.log(1.0001);
};

// Helper to find nearest tick that's divisible by tick spacing
const nearestUsableTick = (tick: number, tickSpacing: number): number => {
  const rounded = Math.round(tick / tickSpacing) * tickSpacing;
  if (rounded < MIN_TICK) return MIN_TICK;
  if (rounded > MAX_TICK) return MAX_TICK;
  return rounded;
};

interface RangeInputProps {
  label: string;
  initTick: number;
  baseToken: HederaToken;
  quoteToken: HederaToken;
  tickSpacing: number;
  tabIndex?: number;
  reverse: boolean;
  onChange: (value: number) => void;
  onFocus: (el: HTMLInputElement | null) => void;
}

function RangeInput({
  label,
  baseToken,
  quoteToken,
  initTick,
  tickSpacing,
  tabIndex,
  reverse,
  onChange,
  onFocus,
}: RangeInputProps) {
  const inputEl = useRef<HTMLInputElement>(null);

  const [input, setInput] = useState<string>('0.00');
  const [tick, setTick] = useState<number>(initTick);

  // When initTick changes, update our internal tick state
  useEffect(() => {
    setTick(initTick);
  }, [initTick]);

  // When tick changes, update the input field with the correct price
  useEffect(() => {
    const price = tickToPrice(tick);
    setInput(formatInput(price, false, tickSpacing === 1 ? 8 : 4));
  }, [tick, tickSpacing]);

  // Handle user input in the price field
  const handleInput = (ev: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = ev.target;
    if (value === '') {
      setInput('0.00');
      return;
    }

    setInput(value);
  };

  // Calculate tick from the price input
  const calculateTick = () => {
    const inputVal = parseFloat(input);
    if (Number.isNaN(inputVal) || inputVal === 0) {
      setInput('0.00');
      return;
    }

    // Convert price to tick
    const tickFromPrice = priceToTick(inputVal);
    
    // Find nearest tick that's divisible by tickSpacing
    const closestTick = nearestUsableTick(tickFromPrice, tickSpacing);
    
    setTick(closestTick);
    onChange(closestTick);
  };

  // Decrease the tick/price value
  const decreaseValue = () => {
    const newTick = reverse ? tick + tickSpacing : tick - tickSpacing;
    setTick(newTick);
    onChange(newTick);
  };

  // Increase the tick/price value
  const increaseValue = () => {
    const newTick = reverse ? tick - tickSpacing : tick + tickSpacing;
    setTick(newTick);
    onChange(newTick);
  };

  // Handle focus on the input field
  const handleFocus = () => {
    if (inputEl.current) {
      onFocus(inputEl.current);
    }
  };

  return (
    <div className="px-3 py-2 mr-3 border rounded border-gray-400 flex flex-col items-center">
      <div className="my-2 text-slate-600 dark:text-slate-300">{label}</div>
      <div className="flex items-center">
        <button
          className="text-2xl px-2 focus:outline-none bg-slate-200 dark:bg-slate-700 border rounded focus:border-gray-400"
          tabIndex={tabIndex}
          onClick={decreaseValue}
          onBlur={calculateTick}
        >
          -
        </button>
        <input
          ref={inputEl}
          className="w-36 p-2 text-xl focus:outline-none text-center bg-white dark:bg-slate-900"
          value={input}
          onChange={handleInput}
          onFocus={handleFocus}
          onBlur={calculateTick}
          tabIndex={tabIndex}
          inputMode="decimal"
        />
        <button
          className="text-2xl px-2 focus:outline-none bg-slate-200 dark:bg-slate-700 border rounded focus:border-gray-400"
          tabIndex={tabIndex}
          onClick={increaseValue}
          onBlur={calculateTick}
        >
          +
        </button>
      </div>
      <div className="my-2 text-slate-600 dark:text-slate-300">
        <TokenLabel name={baseToken.name} symbol={baseToken.symbol} />
        <span> per </span>
        <TokenLabel name={quoteToken.name} symbol={quoteToken.symbol} />
      </div>
    </div>
  );
}

export default RangeInput;
