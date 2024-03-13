"use client";
import { FormEvent, useEffect, useRef, useState } from "react";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { swalCustomClass } from "@/utils/swalConfig";
import { categoryFormData, harvestLogsCategoryDict } from "@/types";
import { Area, Grade } from "@prisma/client";
import { CustomTable, DownloadButton, LoadingRing } from "@/components";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import { use } from "chai";
const HarvestLogs = () => {
  const [harvestLogs, setHarvestLogs] = useState<harvestLogsCategoryDict>({});
  const [areas, setAreas] = useState<{ description: string; id: number }[]>();
  const [dates, setDates] = useState<{ harvestDate: string }[]>();
  const [tableData, setTableData] = useState<{ [key: number]: string[] }>([]);
  const [areaFilter, setAreaFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [dateInput, setDateInput] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [sort, setSort] = useState("");
  useEffect(() => {
    const fetchHarvestLogs = async () => {
      const response = await fetch("/api/inventory_input/harvest_log ");
      if (response.ok) {
        const { harvestLogs, areas, dates } = await response.json();
        setHarvestLogs(harvestLogs);
        setAreas(areas);
        setDates(dates);
        setIsLoading(false);
      }
    };
    fetchHarvestLogs();
  }, []);

  useEffect(() => {
    //update the table data when harvest logf is re rendered
    setTableData(getDefaultData());
  }, [harvestLogs]);

  useEffect(() => {
    filterData();
  }, [areaFilter, dateFilter]);

  useEffect(() => {
    setTableData((prev) => {
      return sortData(prev);
    });
  }, [sort]);
  //turn json to table json data
  function getDefaultData() {
    const defaultTableData: { [key: number]: string[] } = {};

    Object.keys(harvestLogs).map((key) => {
      const harvestLog = harvestLogs[Number(key)];

      const tableRow = [
        String(harvestLog.harvestDate),
        harvestLog.areaName,
        String(harvestLog.quantity),
        String("update delete"),
      ];
      defaultTableData[harvestLog.id] = tableRow;
    });
    return defaultTableData;
  }
  const filterData = () => {
    const defaultTableData = getDefaultData();
    let newTableData = Object.keys(defaultTableData).filter((data) => {
      if (areaFilter == "") {
        return true;
      } else {
        return defaultTableData[Number(data)][1] == areaFilter;
      }
    });
    newTableData = newTableData.filter((data) => {
      if (dateFilter == "") {
        return true;
      } else {
        return defaultTableData[Number(data)][0] == dateFilter;
      }
    });
    const filteredData: typeof defaultTableData = {};
    newTableData.map((key) => {
      filteredData[Number(key)] = defaultTableData[Number(key)];
    });
    setTableData(filteredData);
  };

  //sort data function to sort the table data by date, area and quantity ascending or descending
  const handleUpdate = (index: number) => {
    const area = tableData[index][1];
    const harvestDate = tableData[index][0].split("-").reverse().join("-");
    const swal = withReactContent(Swal);
    setDateInput(tableData[index][0].split("-").reverse().join("-"));

    const onUpdate = async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      swal.showLoading(null);
      const formData = new FormData(event.currentTarget);

      const response = await fetch("/api/inventory_input/harvest_log", {
        method: "PATCH",
        body: formData,
      });
      swal.close();
      if (response.ok) {
        swal
          .fire({
            customClass: swalCustomClass,
            title: "Harvest Log Updated",
            icon: "success",
          })
          .then(() => {
            location.reload();
          });
      } else {
        swal.fire({
          customClass: swalCustomClass,
          title: "Update Error",
          icon: "error",
        });
      }
    };

    swal.fire({
      customClass: swalCustomClass,
      showCancelButton: false,
      showConfirmButton: false,
      html: (
        <form
          className="flex flex-col gap-4"
          action=""
          onSubmit={(e) => {
            onUpdate(e);
          }}
        >
          <input
            type="number"
            name="harvestLogId"
            value={index}
            hidden
            readOnly
          />
          <label htmlFor="">Area</label>
          <select name="area" id="" defaultValue={area} onChange={() => {}}>
            {areas?.map((area, ind) => (
              <option key={ind} value={area.description}>
                {area.description}
              </option>
            ))}
          </select>
          <label htmlFor="">Harvest Date</label>
          <input
            type="date"
            name="harvestDate"
            id="harvestDate"
            className="py-1"
            defaultValue={harvestDate}
            onChange={() => {}}
          />
          <div>
            <button
              type="button"
              className="bg-add-minus hover:bg-slate-500 text-white w-[150px] py-2 px-2 self-center rounded shadow mx-1"
              onClick={(e) => {
                swal.close();
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-primary-color hover:bg-green-700 text-white w-[150px] py-2 px-2 self-center rounded shadow mx-1"
            >
              Submit
            </button>
          </div>
        </form>
      ),
    });
  };
  const handleDelete = (index: number) => {
    const swal = withReactContent(Swal);
    swal
      .fire({
        title: "Are you sure you want to delete ?",
        icon: "warning",
        iconColor: "red",
        showCancelButton: true,
        customClass: {
          confirmButton: "!bg-red-500",
        },
      })
      .then(() => {
        fetch("/api/inventory_input/harvest_log", {
          method: "DELETE",
          body: JSON.stringify({ id: index }),
        }).then(() => {
          location.reload();
        });
      });
  };
  function downloadTableAsExcel() {
    const tableDataArray = Object.values(tableData).map((row) =>
      row.slice(0, -1)
    );

    // Exclude the "actions" header
    const headersWithoutActions = headers.slice(0, -1); // Exclude the last header ("actions")

    // Create a new worksheet
    const ws = XLSX.utils.aoa_to_sheet([
      headersWithoutActions,
      ...tableDataArray,
    ]);

    // Create a new workbook
    const wb = XLSX.utils.book_new();

    // Append the worksheet to the workbook
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");

    // Write the workbook and download it as an Excel file
    XLSX.writeFile(wb, "table_data.xlsx");
  }
  const sortData = (data: {
    [key: number]: string[];
  }): { [key: number]: string[] } => {
    //sort dating according to the option selected in my select sort below
    const sortedKeys = Object.keys(data).sort((a, b) => {
      if (sort == "date ascending") {
        return (
          new Date(data[Number(a)][0]).getTime() -
          new Date(data[Number(b)][0]).getTime()
        );
      } else if (sort == "date descending") {
        return (
          new Date(data[Number(b)][0]).getTime() -
          new Date(data[Number(a)][0]).getTime()
        );
      } else if (sort == "area descending") {
        return data[Number(a)][1].localeCompare(data[Number(b)][1]);
      } else if (sort == "area ascending") {
        return data[Number(b)][1].localeCompare(data[Number(a)][1]);
      } else if (sort == "quantity descending") {
        return Number(data[Number(a)][2]) - Number(data[Number(b)][2]);
      } else if (sort == "quantity ascending") {
        return Number(data[Number(b)][2]) - Number(data[Number(a)][2]);
      } else {
        return 0;
      }
    });

    const sortedData: { [key: number]: string[] } = {};
    sortedKeys.forEach((key, index) => {
      sortedData[index] = data[Number(key)];
    });

    return sortedData;
  };
  const headers = ["Harvest Date", "Area", "Quantity", " "];
  return (
    <div className="h-full w-full bg-white text-black flex flex-col">
      <div className="bg-accent-gray py-2 px-3 flex">
        <label htmlFor="">Sort by</label>
        <select
          name="area"
          id="area"
          className="mx-2 border-[1px] bg-white border-add-minus w-[150px]"
          onChange={(e) => setSort(e.target.value)}
        >
          <option value="Sort by" disabled>
            Sort
          </option>
          <option value="date ascending">Date Ascending</option>
          <option value="date descending">Date Descending</option>
          <option value="area ascending">Area Ascending</option>
          <option value="area descending">Area Descending</option>
          <option value="quantity ascending">Quantity Ascending</option>
          <option value="quantity descending">Quantity Descending</option>
        </select>
        <label>Filters:</label>
        <select
          name="area"
          id="area"
          className="mx-2 border-[1px] bg-white border-add-minus w-[150px]"
          onChange={(e) => {
            setAreaFilter(e.target.value);
          }}
        >
          <option value="">Select Area</option>
          {areas?.map((area) => (
            <option value={area.description} key={area.id}>
              {area.description}
            </option>
          ))}
        </select>
        <label>Date:</label>
        <select
          name="area"
          id="area"
          className="mx-2 border-[1px] bg-white border-add-minus w-[150px]"
          onChange={(e) => {
            setDateFilter(e.target.value);
          }}
        >
          <option value="">Select Date</option>
          {dates?.map((date, ind) => (
            <option value={date.harvestDate} key={ind}>
              {" "}
              {date.harvestDate}
            </option>
          ))}
        </select>
      </div>
      <div className=" flex justify-end">
        <DownloadButton onClick={downloadTableAsExcel} />
      </div>
      <div className="overflow-auto mx-5 max-h-[calc(100vh-220px)]">
        <CustomTable
          headers={headers}
          data={tableData}
          handleDelete={handleDelete}
          handleUpdate={handleUpdate}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};

export default HarvestLogs;
