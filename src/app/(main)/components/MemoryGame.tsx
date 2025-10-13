"use client";

import { motion } from "motion/react";
import { useState, useEffect } from "react";

const CARD_ICONS = ["⚛️", "🎯", "🚀", "💻", "🎨", "⚡", "🔥", "🌟"];

interface Card {
  id: number;
  icon: string;
  isFlipped: boolean;
  isMatched: boolean;
}

export const MemoryGame = () => {
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [isWon, setIsWon] = useState(false);

  const initializeGame = () => {
    const gameCards = [...CARD_ICONS, ...CARD_ICONS]
      .sort(() => Math.random() - 0.5)
      .map((icon, index) => ({
        id: index,
        icon,
        isFlipped: false,
        isMatched: false,
      }));
    setCards(gameCards);
    setFlippedCards([]);
    setMoves(0);
    setIsWon(false);
  };

  useEffect(() => {
    initializeGame();
  }, []);

  useEffect(() => {
    if (flippedCards.length === 2) {
      const [first, second] = flippedCards;
      const firstCard = cards[first];
      const secondCard = cards[second];

      if (firstCard.icon === secondCard.icon) {
        // Match found
        setCards((prev) =>
          prev.map((card) =>
            card.id === first || card.id === second
              ? { ...card, isMatched: true }
              : card
          )
        );
        setFlippedCards([]);
      } else {
        // No match
        setTimeout(() => {
          setCards((prev) =>
            prev.map((card) =>
              card.id === first || card.id === second
                ? { ...card, isFlipped: false }
                : card
            )
          );
          setFlippedCards([]);
        }, 1000);
      }
      setMoves((prev) => prev + 1);
    }
  }, [flippedCards, cards]);

  useEffect(() => {
    if (cards.length > 0 && cards.every((card) => card.isMatched)) {
      setIsWon(true);
    }
  }, [cards]);

  const handleCardClick = (id: number) => {
    if (flippedCards.length === 2) return;
    const card = cards[id];
    if (card.isFlipped || card.isMatched) return;

    setCards((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isFlipped: true } : c))
    );
    setFlippedCards((prev) => [...prev, id]);
  };

  return (
    <div className="flex flex-col items-center justify-center w-full h-full">
      {/* Game Title */}
      <h3 className="text-xl font-bold text-emerald-400 mb-2">Memory Match</h3>

      {/* Game Status */}
      <div className="text-center mb-3">
        {isWon ? (
          <p className="text-lg text-emerald-400 font-semibold">
            You Won in {moves} moves!
          </p>
        ) : (
          <p className="text-sm text-gray-300">Moves: {moves}</p>
        )}
      </div>

      {/* Game Board */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {cards.map((card) => (
          <motion.button
            key={card.id}
            whileHover={{ scale: card.isMatched ? 1 : 1.05 }}
            whileTap={{ scale: card.isMatched ? 1 : 0.95 }}
            onClick={() => handleCardClick(card.id)}
            disabled={card.isMatched}
            className={`w-14 h-14 rounded-lg flex items-center justify-center text-2xl font-bold transition-all ${
              card.isFlipped || card.isMatched
                ? "bg-gradient-to-br from-emerald-500 to-cyan-500"
                : "bg-gray-700 hover:bg-gray-600"
            } ${card.isMatched ? "opacity-50 cursor-default" : ""}`}
          >
            {card.isFlipped || card.isMatched ? card.icon : "?"}
          </motion.button>
        ))}
      </div>

      {/* Reset Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={initializeGame}
        className="px-4 py-1.5 bg-emerald-400/10 text-emerald-400 rounded-lg hover:bg-emerald-400/20 transition-all font-semibold text-sm"
      >
        New Game
      </motion.button>
    </div>
  );
};
