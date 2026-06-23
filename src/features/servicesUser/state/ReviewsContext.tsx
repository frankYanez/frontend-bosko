import React, { createContext, useContext, useState, ReactNode } from "react";
import { fetchReviewsByProvider, Review } from "../services/reviews";

interface ReviewsState {
  reviews: Review[];
  loading: boolean;
  loadReviews: () => Promise<void>;
}

const ReviewsContext = createContext<ReviewsState | undefined>(undefined);

export const ReviewsProvider = ({
  children,
  providerId,
}: {
  children: ReactNode;
  providerId: string;
}) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const loadReviews = async () => {
    setLoading(true);
    try {
      const result = await fetchReviewsByProvider(providerId);
      setReviews(result.data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ReviewsContext.Provider value={{ reviews, loading, loadReviews }}>
      {children}
    </ReviewsContext.Provider>
  );
};

export const useReviews = () => {
  const context = useContext(ReviewsContext);
  if (!context) throw new Error("useReviews must be used within a ReviewsProvider");
  return context;
};
