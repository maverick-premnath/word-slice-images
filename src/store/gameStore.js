import { create } from 'zustand';

export const useGameStore = create((set) => ({
  currentScreen: 'home', // 'home', 'levels', 'game'
  currentWord: null,
  correctSlices: [],
  isGameActive: false,
  
  setScreen: (screen) => set({ currentScreen: screen }),
  setCurrentWord: (word) => set({ currentWord: word, correctSlices: new Array(word?.slices.length).fill(null) || [] }),
  setCorrectSlice: (index, sliceData) => set((state) => {
    const newCorrectSlices = [...state.correctSlices];
    newCorrectSlices[index] = sliceData;
    return { correctSlices: newCorrectSlices };
  }),
  resetGame: () => set({ currentWord: null, correctSlices: [], isGameActive: false }),
  goToLevels: () => set({ currentScreen: 'levels', currentWord: null, correctSlices: [], isGameActive: false }),
  startGame: (word) => set({ 
    currentWord: word, 
    correctSlices: new Array(word.slices.length).fill(null),
    isGameActive: true,
    currentScreen: 'game'
  }),
}));

