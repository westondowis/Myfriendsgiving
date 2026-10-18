import React from 'react';
import { DishItem } from '../types';

interface PrintViewProps {
  dishes: DishItem[];
}

export const PrintView: React.FC<PrintViewProps> = ({ dishes }) => {
  const coreDishes = dishes.filter((d) => d.category === 'core');
  const customDishes = dishes.filter((d) => d.category === 'custom');

  return (
    <div className="hidden print-only p-8 text-black bg-white max-w-3xl mx-auto">
      <div className="border-b-2 border-black pb-4 mb-6 text-center">
        <h1 className="text-2xl font-bold font-serif uppercase tracking-wider">
          Friendsgiving 2026: The Feast Ledger
        </h1>
        <p className="text-sm text-gray-700 mt-1">
          Master Kitchen & Fridge Coordination Checklist
        </p>
        <p className="text-xs text-gray-500 mt-0.5">
          Printed on {new Date().toLocaleDateString()}
        </p>
      </div>

      <div className="mb-6">
        <h2 className="text-base font-bold uppercase tracking-wider border-b border-gray-400 pb-1 mb-3">
          1. Essential Core Menu ({coreDishes.filter((d) => !!d.claimedBy).length} of {coreDishes.length} Secured)
        </h2>
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-gray-300 text-gray-600">
              <th className="py-1.5 w-8 text-center">Done</th>
              <th className="py-1.5 font-semibold">Dish / Item</th>
              <th className="py-1.5 font-semibold">Brought By</th>
              <th className="py-1.5 font-semibold">Dietary / Notes</th>
            </tr>
          </thead>
          <tbody>
            {coreDishes.map((dish, i) => (
              <tr key={dish.id} className="border-b border-gray-200">
                <td className="py-2 text-center text-base">
                  <span className="inline-block w-4 h-4 border border-black rounded-xs"></span>
                </td>
                <td className="py-2 font-medium">
                  {i + 1}. {dish.name}
                </td>
                <td className="py-2 font-semibold">
                  {dish.claimedBy ? dish.claimedBy : <span className="text-gray-400 italic">Unclaimed</span>}
                </td>
                <td className="py-2 text-gray-600">
                  {dish.dietary ? `[${dish.dietary}] ` : ''}
                  {dish.notes || '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {customDishes.length > 0 && (
        <div className="mb-6">
          <h2 className="text-base font-bold uppercase tracking-wider border-b border-gray-400 pb-1 mb-3">
            2. Additional Goodies & Wildcards ({customDishes.length} Items)
          </h2>
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-300 text-gray-600">
                <th className="py-1.5 w-8 text-center">Done</th>
                <th className="py-1.5 font-semibold">Dish / Item</th>
                <th className="py-1.5 font-semibold">Brought By</th>
                <th className="py-1.5 font-semibold">Notes</th>
              </tr>
            </thead>
            <tbody>
              {customDishes.map((dish, i) => (
                <tr key={dish.id} className="border-b border-gray-200">
                  <td className="py-2 text-center text-base">
                    <span className="inline-block w-4 h-4 border border-black rounded-xs"></span>
                  </td>
                  <td className="py-2 font-medium">
                    {dish.name}
                  </td>
                  <td className="py-2 font-semibold">
                    {dish.claimedBy || '-'}
                  </td>
                  <td className="py-2 text-gray-600">
                    {dish.dietary ? `[${dish.dietary}] ` : ''}
                    {dish.notes || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-8 pt-4 border-t border-gray-400 text-center text-xs text-gray-500">
        Happy Friendsgiving! Eat, drink, and be thankful.
      </div>
    </div>
  );
};
