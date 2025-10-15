import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type TarotCard = Database["public"]["Tables"]["tarot_cards"]["Row"];
export type OshoZenCard = Database["public"]["Tables"]["osho_zen_cards"]["Row"];
export type CardReadingHistory = Database["public"]["Tables"]["card_reading_history"]["Row"];

export class CardReadingService {
  // ===== Tarot Cards =====

  static async getAllTarotCards() {
    try {
      const { data, error } = await supabase
        .from("tarot_cards")
        .select("*")
        .order("card_number", { ascending: true });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching tarot cards:", error);
      throw error;
    }
  }

  static async getTarotCardsByArcana(arcana: "major" | "minor") {
    try {
      const { data, error } = await supabase
        .from("tarot_cards")
        .select("*")
        .eq("arcana_type", arcana)
        .order("card_number", { ascending: true });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching tarot cards by arcana:", error);
      throw error;
    }
  }

  static async getTarotCardsBySuit(suit: string) {
    try {
      const { data, error } = await supabase
        .from("tarot_cards")
        .select("*")
        .eq("suit", suit);
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching tarot cards by suit:", error);
      throw error;
    }
  }

  static async drawTarotCards(count: number = 1) {
    try {
      const allCards = await this.getAllTarotCards();
      const drawn: TarotCard[] = [];

      for (let i = 0; i < count && i < allCards.length; i++) {
        const randomIndex = Math.floor(Math.random() * allCards.length);
        drawn.push(allCards[randomIndex]);
        allCards.splice(randomIndex, 1);
      }

      return drawn;
    } catch (error) {
      console.error("Error drawing tarot cards:", error);
      throw error;
    }
  }

  // ===== Osho Zen Cards =====

  static async getAllOshoZenCards() {
    try {
      const { data, error } = await supabase
        .from("osho_zen_cards")
        .select("*");
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching osho zen cards:", error);
      throw error;
    }
  }

  static async drawOshoZenCard() {
    try {
      const allCards = await this.getAllOshoZenCards();
      if (allCards.length === 0) return null;
      return allCards[Math.floor(Math.random() * allCards.length)];
    } catch (error) {
      console.error("Error drawing osho zen card:", error);
      throw error;
    }
  }

  // ===== Card Readings =====

  static async saveCardReading(userId: string, reading: Omit<CardReadingHistory, "id" | "created_at">) {
    try {
      const { data, error } = await supabase
        .from("card_reading_history")
        .insert({ user_id: userId, ...reading })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error saving card reading:", error);
      throw error;
    }
  }

  static async getUserCardReadings(userId: string, type?: "tarot" | "osho_zen") {
    try {
      let query = supabase
        .from("card_reading_history")
        .select("*")
        .eq("user_id", userId);
      
      if (type) {
        query = query.eq("reading_type", type);
      }

      const { data, error } = await query.order("created_at", { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching user card readings:", error);
      throw error;
    }
  }

  static async updateCardReadingReflection(readingId: string, reflection: string) {
    try {
      const { data, error } = await supabase
        .from("card_reading_history")
        .update({ user_reflection: reflection })
        .eq("id", readingId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error updating card reading reflection:", error);
      throw error;
    }
  }

  static async deleteCardReading(readingId: string) {
    try {
      const { error } = await supabase
        .from("card_reading_history")
        .delete()
        .eq("id", readingId);
      
      if (error) throw error;
    } catch (error) {
      console.error("Error deleting card reading:", error);
      throw error;
    }
  }

  // ===== Admin Methods =====

  static async createTarotCard(card: Omit<TarotCard, "id" | "created_at">) {
    try {
      const { data, error } = await supabase
        .from("tarot_cards")
        .insert(card)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error creating tarot card:", error);
      throw error;
    }
  }

  static async createOshoZenCard(card: Omit<OshoZenCard, "id" | "created_at">) {
    try {
      const { data, error } = await supabase
        .from("osho_zen_cards")
        .insert(card)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error creating osho zen card:", error);
      throw error;
    }
  }

  static async performThreeCardSpread(userId: string) {
    try {
      const cards = await this.drawTarotCards(3);
      const reading = await this.saveCardReading(userId, {
        reading_type: "tarot",
        cards_drawn: cards.map(c => c.id),
        reading_interpretation: `Three-card spread: ${cards.map(c => c.card_name).join(", ")}`,
      });
      return reading;
    } catch (error) {
      console.error("Error performing three-card spread:", error);
      throw error;
    }
  }

  static async performDailyCelticCrossSpread(userId: string) {
    try {
      const cards = await this.drawTarotCards(10);
      const positions = [
        "Current Situation",
        "Challenge/Cross",
        "Distant Past",
        "Foundation",
        "Recent Past",
        "Near Future",
        "Fears/Obstacles",
        "External Influences",
        "Hopes/Desires",
        "Outcome",
      ];

      const interpretation = cards
        .map((card, index) => `${positions[index]}: ${card.card_name}`)
        .join(" | ");

      const reading = await this.saveCardReading(userId, {
        reading_type: "tarot",
        cards_drawn: cards.map(c => c.id),
        reading_interpretation: interpretation,
      });
      return reading;
    } catch (error) {
      console.error("Error performing celtic cross spread:", error);
      throw error;
    }
  }
}
