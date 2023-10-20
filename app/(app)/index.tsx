import {
  View,
  Text,
  ListRenderItem,
  StyleSheet,
  SectionList,
} from "react-native";
import React, { useEffect, useState } from "react";
import { supabase } from "../../config/initSupabase";
import { TouchableOpacity } from "react-native-gesture-handler";
import { useAuth } from "../../provider/AuthProvider";
import { Ionicons } from "@expo/vector-icons";
import BottomTodoSheet from "../../components/BottomTodoSheet";

const Page = () => {
  const [listItems, setListItems] = useState<any[]>([]);
  const [todoOptions, setTodoOptions] = useState<any[]>([
    "Get milk",
    "Fast and furuious",
    "A song of ice and fire",
  ]);
  const { user } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      // Load categories from Supabase
      let { data: categories } = await supabase
        .from("categories")
        .select("id, category");
      // Load todos from Supabase
      const { data: todos } = await supabase
        .from("todos")
        .select()
        .eq("historic", false);
      const { data: historic } = await supabase
        .from("todos")
        .select()
        .eq("historic", true);

      // Load previously used todos from Supabase and set recommendations
      if (historic) {
        // remove duplicate names
        const combinedHistoric = [
          ...historic.map((item: any) => item.name),
          ...todoOptions,
        ];
        const uniqueHistoric = [...new Set(combinedHistoric)];
        setTodoOptions(uniqueHistoric);
      }

      // Group todos by category
      if (todos) {
        const grouped: any = categories?.map((category: any) => {
          const items = todos.filter(
            (todo: any) => todo.category === category.id,
          );
          return { ...category, data: items };
        });
        setListItems(grouped);
      }
    };
    fetchData();
  }, []);

  const onAddItem = async (name: string, categoryId: number) => {
    const result = await supabase
      .from("todos")
      .insert([{ name, category: categoryId, user_id: user?.id }])
      .select();

    // Add item to state
    if (result.data) {
      const category = listItems.find((category) => category.id === categoryId);
      if (category) {
        category.data.push(result.data[0]);
        setListItems((prev) => [...prev]);
      }
    }
  };

  // Shopping List Item Row
  const renderTodoRow: ListRenderItem<any> = ({ item }) => {
    const onSelect = async (todo: any) => {
      // Remove item by setting historic to true
      await supabase.from("todos").update({ historic: true }).eq("id", todo.id);

      // Remove item from state
      const category = listItems.find(
        (category) => category.id === todo.category,
      );
      if (category) {
        category.data = category.data.filter(
          (item: any) => item.id !== todo.id,
        );
        setListItems((prev) => [...prev]);
      }
    };

    return (
      <TouchableOpacity
        onPress={() => onSelect(item)}
        style={[styles.todoRow, { backgroundColor: "#0c3824" }]}
      >
        <Text style={styles.todoName}>{item.name}</Text>
        <Ionicons name="checkmark" size={24} color="white" />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {listItems.length > 0 && (
        <SectionList
          contentContainerStyle={{ paddingBottom: 150 }}
          sections={listItems}
          stickySectionHeadersEnabled={false}
          renderItem={renderTodoRow}
          renderSectionHeader={({ section: { category } }) => (
            <Text style={styles.sectionHeader}>{category}</Text>
          )}
        />
      )}

      <BottomTodoSheet
        listItems={listItems}
        todoOptions={todoOptions}
        onItemSelected={(item, categoryId) => onAddItem(item, categoryId)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#2a2a2a",
  },
  todoRow: {
    flexDirection: "row",
    backgroundColor: "#2b825b",
    padding: 10,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 4,
  },
  todoName: {
    color: "#fff",
    fontSize: 20,
    flex: 1,
  },
  sectionHeader: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginHorizontal: 16,
    marginTop: 20,
  },
});

export default Page;
