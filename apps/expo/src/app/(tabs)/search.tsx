import React, { useEffect, useState } from "react";
import { Keyboard, ScrollView, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useQuery } from "@tanstack/react-query";

import { getMediaPoster, searchTitle } from "@movie-web/tmdb";

import type { ItemData } from "~/components/item/item";
import Item from "~/components/item/item";
import {
  bookmarks,
  ItemListSection,
  watching,
} from "~/components/item/ItemListSection";
import ScreenLayout from "~/components/layout/ScreenLayout";
import { SearchBar } from "~/components/ui/Searchbar";
import { Text } from "~/components/ui/Text";

export default function HomeScreen() {
  const [query, setQuery] = useState("");
  const translateY = useSharedValue(0);
  const fadeAnim = useSharedValue(1);
  const searchResultsOpacity = useSharedValue(0);
  const searchResultsScale = useSharedValue(0.95);
  const [searchResultsLoaded, setSearchResultsLoaded] = useState(false);

  const { data } = useQuery({
    queryKey: ["searchResults", query],
    queryFn: () => fetchSearchResults(query),
  });

  useEffect(() => {
    if (data && data.length > 0 && query) {
      searchResultsOpacity.value = withTiming(1, { duration: 500 });
      searchResultsScale.value = withTiming(1, { duration: 500 });
      setSearchResultsLoaded(true);
    } else if (!query) {
      searchResultsOpacity.value = withTiming(0, { duration: 500 });
      searchResultsScale.value = withTiming(0.95, { duration: 500 });
      setSearchResultsLoaded(false);
    }
  }, [data, query, searchResultsOpacity, searchResultsScale]);

  useEffect(() => {
    const keyboardWillShowListener = Keyboard.addListener(
      "keyboardWillShow",
      (e) => {
        translateY.value = withTiming(
          -(e.endCoordinates.height - 110), // determines the height of the Searchbar above keyboard, use Platform.select to adjust value if needed
          {
            duration: e.duration ?? 250, // duration always returns 0 on Android, adjust value if needed
            easing: Easing.out(Easing.ease),
          },
        );
      },
    );

    const keyboardWillHideListener = Keyboard.addListener(
      "keyboardWillHide",
      () => {
        translateY.value = withTiming(0, {
          duration: 250,
          easing: Easing.out(Easing.ease),
        });
      },
    );

    return () => {
      keyboardWillShowListener.remove();
      keyboardWillHideListener.remove();
    };
  }, [translateY]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
      opacity: fadeAnim.value,
    };
  });

  const searchResultsStyle = useAnimatedStyle(() => {
    return {
      opacity: searchResultsOpacity.value,
      transform: [{ scale: searchResultsScale.value }],
    };
  });

  const handleScrollBegin = () => {
    fadeAnim.value = withTiming(0, {
      duration: 100,
    });
  };

  const handleScrollEnd = () => {
    fadeAnim.value = withTiming(1, {
      duration: 100,
    });
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        onScrollBeginDrag={handleScrollBegin}
        onMomentumScrollEnd={handleScrollEnd}
        scrollEnabled={searchResultsLoaded ? true : false}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
      >
        <ScreenLayout
          title={
            <View className="flex-row items-center">
              <Text className="text-2xl font-bold">Search</Text>
            </View>
          }
        >
          {searchResultsLoaded ? (
            <Animated.View style={[searchResultsStyle, { flex: 1 }]}>
              <View className="flex w-full flex-1 flex-row flex-wrap justify-start">
                {data?.map((item, index) => (
                  <View key={index} className="basis-1/2 px-3 pb-3">
                    <Item data={item} />
                  </View>
                ))}
              </View>
            </Animated.View>
          ) : (
            <ScrollView
              scrollEnabled={
                bookmarks.length > 0 || watching.length > 0 ? true : false
              }
            >
              <ItemListSection
                title="Bookmarks"
                items={bookmarks.concat(watching)}
              />
              <ItemListSection
                title="Continue Watching"
                items={watching.concat(bookmarks)}
              />
            </ScrollView>
          )}
        </ScreenLayout>
      </ScrollView>
      <Animated.View
        style={[
          { position: "absolute", left: 0, right: 0, bottom: 0 },
          animatedStyle,
        ]}
      >
        <SearchBar onSearchChange={setQuery} />
      </Animated.View>
    </View>
  );
}

async function fetchSearchResults(query: string): Promise<ItemData[]> {
  const results = await searchTitle(query);

  return results.map((result) => ({
    id: result.id.toString(),
    title: result.media_type === "tv" ? result.name : result.title,
    posterUrl: getMediaPoster(result.poster_path),
    year: new Date(
      result.media_type === "tv" ? result.first_air_date : result.release_date,
    ).getFullYear(),
    type: result.media_type,
  }));
}
