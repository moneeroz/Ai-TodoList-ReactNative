import {
  View,
  Text,
  ListRenderItem,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import React, { useMemo, useRef, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import BottomSheet, {
  BottomSheetTextInput,
  BottomSheetFlatList,
} from "@gorhom/bottom-sheet";
import { supabase } from "../config/initSupabase";
export type Ref = BottomSheet;

interface Props {
  listItems: any[];
  todoOptions: any[];
  onItemSelected: (item: string, categoryId: number) => void;
}

const BottomTodoSheet = (props: Props) => {
  const snapPoints = useMemo(() => ["14%", "75%"], []);
  const [item, setItem] = useState("");
  const bottomSheetRef = useRef<BottomSheet>(null);

  const renderRecommendationRow: ListRenderItem<any> = ({ item }) => {
    const onAddItem = async (todo: any) => {
      bottomSheetRef.current?.collapse();

      // Get embedding for the todo item
      const { data } = await supabase.functions.invoke("getEmbedding", {
        body: { input: todo },
      });

      // Match the embedding to a category
      const { data: documents } = await supabase.rpc("match_category", {
        query_embedding: data.embedding,
        match_threshold: 0.8,
        match_count: 1,
      });

      // Add item to shopping list
      props.onItemSelected(item, documents[0].id);
      setItem("");
    };

    return (
      <TouchableOpacity onPress={() => onAddItem(item)} style={styles.todoRow}>
        <Text style={{ color: "#fff", fontSize: 20, flex: 1 }}>{item}</Text>
        <Ionicons name="add-circle-outline" size={24} color="white" />
      </TouchableOpacity>
    );
  };

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={0}
      snapPoints={snapPoints}
      handleIndicatorStyle={{ backgroundColor: "#fff" }}
      backgroundStyle={{ backgroundColor: "#151515" }}
    >
      <View style={styles.searchRow}>
        <BottomSheetTextInput
          style={styles.inputField}
          placeholder="I need..."
          placeholderTextColor={"#fff"}
          onChangeText={setItem}
          value={item}
        />
      </View>
      <BottomSheetFlatList
        data={item !== "" ? [item, ...props.todoOptions] : props.todoOptions}
        keyExtractor={(item, index) => index.toString()}
        renderItem={renderRecommendationRow}
        contentContainerStyle={styles.todoContainer}
      />
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 10,
  },
  inputField: {
    flex: 1,
    marginVertical: 4,
    height: 50,
    borderWidth: 1,
    borderColor: "#2b825b",
    borderRadius: 4,
    padding: 10,
    color: "#fff",
    backgroundColor: "#363636",
    marginBottom: 40,
  },
  todoContainer: {
    paddingBottom: 20,
  },
  todoRow: {
    flexDirection: "row",
    backgroundColor: "#2b825b",
    padding: 10,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 4,
  },
});

export default BottomTodoSheet;
